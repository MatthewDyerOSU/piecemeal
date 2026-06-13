-- Piece-Meal: restrict recipe deletion and household-share removal.
--
-- Permanent deletion (removing the recipe row for everyone) is now
-- owner-only. Removing a recipe from a household (deleting a
-- recipe_households row) is allowed for anyone with access, but only for
-- households they themselves belong to — so a member can opt their own
-- household out without being able to revoke other households' access.
-- Run after 20260613190000_recipe_household_sharing.sql.

drop policy if exists "Access owned or shared recipes (delete)" on public.recipes;

create policy "Only the owner can delete a recipe"
  on public.recipes for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "Remove shares for accessible recipes"
  on public.recipe_households;

create policy "Remove shares for your own households"
  on public.recipe_households for delete
  using (
    public.user_can_access_recipe(recipe_id)
    and public.is_household_member(household_id)
  );
