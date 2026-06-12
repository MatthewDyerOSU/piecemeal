-- Piece-Meal: recipe tags (healthy, quick, easy).
-- Run this in the Supabase SQL editor before deploying the tags version
-- of the app. Backward compatible: existing recipes get no tags.

alter table public.recipes
  add column if not exists tags text[] not null default '{}';

alter table public.recipes
  add constraint recipes_tags_allowed
  check (tags <@ array['healthy', 'quick', 'easy']::text[]);
