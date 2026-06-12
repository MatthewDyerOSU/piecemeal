-- Piece-Meal: allow ingredients to be grouped within a recipe (e.g. "For
-- the salmon" / "For the salsa"). The column becomes jsonb with the shape
--   [{ "name": "Salmon", "items": ["1 lb salmon", ...] }, ...]
-- Existing flat ingredient lists become a single unnamed group.
-- Run this in the Supabase SQL editor BEFORE deploying the grouped-
-- ingredients version of the app, after the instructions_as_steps
-- migration.

alter table public.recipes
  alter column ingredients drop default,
  alter column ingredients type jsonb
    using case
      when cardinality(ingredients) = 0 then '[]'::jsonb
      else jsonb_build_array(
        jsonb_build_object('name', '', 'items', to_jsonb(ingredients))
      )
    end,
  alter column ingredients set default '[]'::jsonb;
