-- Piece-Meal: fix recipe creation failing under RLS.
--
-- Symptom: creating a recipe failed with
--   "new row violates row-level security policy for table 'recipes'".
--
-- Cause: the SELECT policy introduced with per-recipe household sharing
-- (20260613190000) authorizes reads via user_can_access_recipe(id), which
-- re-queries the recipes table by id. The app inserts with a RETURNING
-- clause (supabase .insert(...).select("id")), and on INSERT ... RETURNING
-- Postgres applies the SELECT policy to the row being returned. A row
-- still being inserted is not visible to a subquery within the same
-- command, so the function returns false, the returned row is judged
-- unreadable, and the insert is rejected. (The INSERT WITH CHECK itself
-- passes; only the RETURNING step fails.)
--
-- Fix: authorize the owner directly from the row's own user_id column
-- (which IS available during RETURNING), and fall back to the sharing
-- helper only for non-owner/household access to already-committed rows.
-- This restores the pre-sharing behavior for owners while keeping shared
-- visibility intact.
--
-- Run after 20260613210000_owner_only_edit_and_comments.sql.

drop policy if exists "Access owned or shared recipes (select)" on public.recipes;

create policy "Access owned or shared recipes (select)"
  on public.recipes for select
  using (
    user_id = (select auth.uid())
    or public.user_can_access_recipe(id)
  );
