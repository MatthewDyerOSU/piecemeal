-- Piece-Meal: owner-only recipe editing + per-recipe comments.
--
-- 1. Editing a recipe's content (name, ingredients, steps, tags) is now
--    owner-only, matching how permanent deletion already works. Household
--    members a recipe is shared with keep their ability to add/remove it
--    from their own households (that lives in recipe_households, untouched
--    here), they just can no longer change the recipe itself.
--
-- 2. Comments: anyone who can access a recipe can leave a comment on it
--    (little notes about tweaks they made, substitutions, etc.). A comment
--    can be removed by its author or by the recipe's owner.
--
-- Run after 20260613200000_recipe_delete_owner_only.sql.

-- --- 1. Owner-only content editing ----------------------------------------

drop policy if exists "Access owned or shared recipes (update)" on public.recipes;

create policy "Only the owner can update a recipe"
  on public.recipes for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- --- 2. Comments -----------------------------------------------------------

create table if not exists public.recipe_comments (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Display name captured at write time so the comment always has an
  -- attribution even if the author later leaves every shared household.
  author_name text not null default 'Member',
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists recipe_comments_recipe_idx
  on public.recipe_comments (recipe_id, created_at);

alter table public.recipe_comments enable row level security;

-- Security definer so the comment policies don't recurse through the
-- recipes table's own RLS when asking "does this user own the recipe?".
create or replace function public.is_recipe_owner(rid uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.recipes r
    where r.id = rid and r.user_id = auth.uid()
  );
$$;

create policy "View comments on accessible recipes"
  on public.recipe_comments for select
  using (public.user_can_access_recipe(recipe_id));

create policy "Author or recipe owner can delete a comment"
  on public.recipe_comments for delete
  using (
    user_id = (select auth.uid())
    or public.is_recipe_owner(recipe_id)
  );

-- Inserts go through this definer function so the author's display name is
-- captured from auth.users without granting the table broad read access,
-- and access is enforced before anything is written. There is deliberately
-- no INSERT policy: direct inserts are denied, the function is the only way.
create or replace function public.add_recipe_comment(rid uuid, comment_body text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  author text;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;
  if not public.user_can_access_recipe(rid) then
    raise exception 'You do not have access to this recipe.';
  end if;
  if char_length(trim(coalesce(comment_body, ''))) = 0 then
    raise exception 'Enter a comment.';
  end if;

  select coalesce(
    nullif((
      select m.display_name from public.household_members m
      where m.user_id = auth.uid() and m.display_name <> '' limit 1
    ), ''),
    (select u.raw_user_meta_data ->> 'full_name' from auth.users u
       where u.id = auth.uid()),
    (select u.email from auth.users u where u.id = auth.uid()),
    'Member'
  ) into author;

  insert into public.recipe_comments (recipe_id, user_id, author_name, body)
  values (rid, auth.uid(), author, left(trim(comment_body), 2000));
end;
$$;

revoke execute on function public.add_recipe_comment(uuid, text) from public, anon;
grant execute on function public.add_recipe_comment(uuid, text) to authenticated;
