-- Piece-Meal: households, so two accounts can share one recipe collection.
-- A user belongs to at most one household. Recipes stay owned by their
-- author; every household member can view, edit, and delete them.
-- Joining works with a short invite code (no email infrastructure needed).
-- Run this in the Supabase SQL editor BEFORE deploying the household
-- version of the app (it is backward compatible: solo users see exactly
-- what they saw before).

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  invite_code text not null unique
    default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null default '',
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- One household per account keeps the model (and the policies) simple.
create unique index if not exists household_members_one_per_user
  on public.household_members (user_id);

alter table public.households enable row level security;
alter table public.household_members enable row level security;

-- Security definer helpers: policies that query household_members from
-- household_members (or recipes) would recurse through RLS; these
-- functions bypass it safely for a single, narrow question.

create or replace function public.is_household_member(hid uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

create or replace function public.shares_household_with(target uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members me
    join public.household_members them
      on them.household_id = me.household_id
    where me.user_id = auth.uid() and them.user_id = target
  );
$$;

create policy "Members can view their household"
  on public.households for select
  using (public.is_household_member(id));

create policy "Members can rename their household"
  on public.households for update
  using (public.is_household_member(id))
  with check (public.is_household_member(id));

create policy "Members can view their household's membership"
  on public.household_members for select
  using (user_id = (select auth.uid()) or public.shares_household_with(user_id));

create policy "Users can leave a household"
  on public.household_members for delete
  using (user_id = (select auth.uid()));

-- Recipes: visible and editable across the household, not just the owner.
drop policy if exists "Users can view their own recipes" on public.recipes;
drop policy if exists "Users can update their own recipes" on public.recipes;
drop policy if exists "Users can delete their own recipes" on public.recipes;

create policy "Household members can view recipes"
  on public.recipes for select
  using ((select auth.uid()) = user_id or public.shares_household_with(user_id));

create policy "Household members can update recipes"
  on public.recipes for update
  using ((select auth.uid()) = user_id or public.shares_household_with(user_id))
  with check ((select auth.uid()) = user_id or public.shares_household_with(user_id));

create policy "Household members can delete recipes"
  on public.recipes for delete
  using ((select auth.uid()) = user_id or public.shares_household_with(user_id));

-- Create / join / leave run as definer so they can look up invite codes
-- and read display names from auth.users without broad table grants.

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
  if exists (select 1 from public.household_members m where m.user_id = auth.uid()) then
    raise exception 'You are already in a household. Leave it before creating a new one.';
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
  if exists (select 1 from public.household_members m where m.user_id = auth.uid()) then
    raise exception 'You are already in a household. Leave it before joining another.';
  end if;

  select h.id into hid
  from public.households h
  where h.invite_code = lower(trim(code));

  if hid is null then
    raise exception 'That invite code was not found. Check it and try again.';
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

create or replace function public.leave_household()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.household_members where user_id = auth.uid();
  -- Remove households nobody belongs to anymore.
  delete from public.households h
  where not exists (
    select 1 from public.household_members m where m.household_id = h.id
  );
end;
$$;

revoke execute on function public.create_household(text) from public, anon;
revoke execute on function public.join_household(text) from public, anon;
revoke execute on function public.leave_household() from public, anon;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.join_household(text) to authenticated;
grant execute on function public.leave_household() to authenticated;
