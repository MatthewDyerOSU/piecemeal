-- Piece-Meal: store instructions as an ordered array of steps (text[])
-- instead of a single text blob. Existing instructions are split on
-- newlines, dropping empty lines.
-- Run this in the Supabase SQL editor BEFORE deploying the itemized-entry
-- version of the app (the app expects an array after this change).

alter table public.recipes
  alter column instructions drop default,
  alter column instructions type text[]
    using array_remove(
      string_to_array(replace(instructions, chr(13), ''), chr(10)),
      ''
    ),
  alter column instructions set default '{}';
