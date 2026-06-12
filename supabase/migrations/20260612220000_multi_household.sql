-- Piece-Meal: allow membership in multiple households. Every household a
-- user belongs to sees all of that user's recipes (the existing recipe
-- policies already handle this via shares_household_with).
-- Run this in the Supabase SQL editor BEFORE deploying the
-- multi-household version of the app (leave_household gains an argument).

-- 1. Drop the one-household-per-user restriction.
drop index if exists public.household_members_one_per_user;

-- 2. Tighten membership visibility: rows are visible only within the
-- household they belong to. The previous policy (based on sharing *any*
-- household) would have let housemates see which other households a
-- person belongs to.
drop policy if exists "Members can view their household's membership"
  on public.household_members;
create policy "Members can view their household's membership"
  on public.household_members for select
  using (public.is_household_member(household_id));

-- 3. create_household: no longer rejects users who already have one.
create or replace function public.create_household(household_name text)
returns table (id uuid, name text, invite_code text)
language plpgsql security definer set search_path = ''
as $$
declare
  hid uuid;
  member_name text;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;

  insert into public.households (name)
  values (coalesce(nullif(trim(household_name), ''), 'Our household'))
  returning households.id into hid;

  select coalesce(u.raw_user_meta_data ->> 'full_name', u.email, 'Member')
  into member_name
  from auth.users u where u.id = auth.uid();

  insert into public.household_members (household_id, user_id, display_name)
  values (hid, auth.uid(), member_name);

  return query
    select h.id, h.name, h.invite_code
    from public.households h where h.id = hid;
end;
$$;

-- 4. join_household: only rejects joining a household twice.
create or replace function public.join_household(code text)
returns table (id uuid, name text)
language plpgsql security definer set search_path = ''
as $$
declare
  hid uuid;
  member_name text;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;

  select h.id into hid
  from public.households h
  where h.invite_code = lower(trim(code));

  if hid is null then
    raise exception 'That invite code was not found. Check it and try again.';
  end if;

  if exists (
    select 1 from public.household_members m
    where m.household_id = hid and m.user_id = auth.uid()
  ) then
    raise exception 'You are already a member of this household.';
  end if;

  select coalesce(u.raw_user_meta_data ->> 'full_name', u.email, 'Member')
  into member_name
  from auth.users u where u.id = auth.uid();

  insert into public.household_members (household_id, user_id, display_name)
  values (hid, auth.uid(), member_name);

  return query
    select h.id, h.name from public.households h where h.id = hid;
end;
$$;

-- 5. leave_household now targets one household instead of all of them.
drop function if exists public.leave_household();

create or replace function public.leave_household(hid uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.household_members
  where user_id = auth.uid() and household_id = hid;

  -- Remove the household if nobody belongs to it anymore.
  delete from public.households h
  where h.id = hid
    and not exists (
      select 1 from public.household_members m where m.household_id = h.id
    );
end;
$$;

revoke execute on function public.leave_household(uuid) from public, anon;
grant execute on function public.leave_household(uuid) to authenticated;
