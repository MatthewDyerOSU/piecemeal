-- Piece-Meal: allow servings to be a range or free text.
--
-- servings started as an integer, but people want to express ranges like
-- "2-4" or notes like "makes 12". Convert the column to text. Existing
-- integer values are preserved as their text form. total_minutes stays a
-- number. Run after 20260615010000_recipe_servings_and_time.sql.

alter table public.recipes
  drop constraint if exists recipes_servings_check;

alter table public.recipes
  alter column servings type text
    using (case when servings is null then null else servings::text end);

alter table public.recipes
  add constraint recipes_servings_len
    check (servings is null or char_length(servings) between 1 and 50);
