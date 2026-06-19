-- Piece-Meal: add per-recipe servings and total time.
--
-- Two optional facts about a recipe: how many people it feeds and the
-- estimated total time to make it (stored in whole minutes). Both are
-- nullable — null means "not set" and the app simply omits them.
-- Run after 20260615000000_fix_recipe_select_returning.sql.

alter table public.recipes
  add column if not exists servings integer
    check (servings is null or servings > 0),
  add column if not exists total_minutes integer
    check (total_minutes is null or total_minutes > 0);
