-- Piece-Meal: explicit per-recipe household sharing.
--
-- Previously any member of any household the owner belonged to could see
-- every one of the owner's recipes. This replaces that with an explicit
-- recipe -> household share list: a recipe is accessible to its owner and
-- to members of any household it is shared with.
--
-- The backfill preserves current visibility by sharing each existing
-- recipe with every household its owner belongs to, so nothing disappears
-- when this deploys. Run after the households migrations.

create table if not exists public.recipe_households (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  primary key (recipe_id, household_id)
);

create index if not exists recipe_households_household_idx
  on public.recipe_households (household_id);

-- Security definer so the recipes/recipe_households policies can call it
-- without recursing through RLS.
create or replace function public.user_can_access_recipe(rid uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select
    exists (
      select 1 from public.recipes r
      where r.id = rid and r.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.recipe_households rh
      join public.household_members hm on hm.household_id = rh.household_id
      where rh.recipe_id = rid and hm.user_id = auth.uid()
    );
$$;

alter table public.recipe_households enable row level security;

create policy "View shares for accessible recipes"
  on public.recipe_households for select
  using (public.user_can_access_recipe(recipe_id));

create policy "Add shares to your households for accessible recipes"
  on public.recipe_households for insert
  with check (
    public.user_can_access_recipe(recipe_id)
    and public.is_household_member(household_id)
  );

create policy "Remove shares for accessible recipes"
  on public.recipe_households for delete
  using (public.user_can_access_recipe(recipe_id));

-- Preserve current access before switching the recipe policies over.
insert into public.recipe_households (recipe_id, household_id)
select r.id, hm.household_id
from public.recipes r
join public.household_members hm on hm.user_id = r.user_id
on conflict do nothing;

-- Swap the household-wide recipe policies for explicit-share access.
drop policy if exists "Household members can view recipes" on public.recipes;
drop policy if exists "Household members can update recipes" on public.recipes;
drop policy if exists "Household members can delete recipes" on public.recipes;

create policy "Access owned or shared recipes (select)"
  on public.recipes for select
  using (public.user_can_access_recipe(id));

create policy "Access owned or shared recipes (update)"
  on public.recipes for update
  using (public.user_can_access_recipe(id))
  with check (public.user_can_access_recipe(id));

create policy "Access owned or shared recipes (delete)"
  on public.recipes for delete
  using (public.user_can_access_recipe(id));
