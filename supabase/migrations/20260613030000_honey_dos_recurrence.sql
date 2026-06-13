-- Piece-Meal: recurring Honey-Dos. A per-item cadence; recurring items
-- auto-uncheck at the start of each calendar period (lazy reset on page
-- load). checked_at records when an item was last checked, so the reset
-- can tell whether it was checked in the current period.
-- Run this after 20260613020000_honey_dos.sql.

alter table public.honey_dos
  add column if not exists cadence text not null default 'none',
  add column if not exists checked_at timestamptz;

alter table public.honey_dos
  drop constraint if exists honey_dos_cadence_allowed;

alter table public.honey_dos
  add constraint honey_dos_cadence_allowed
  check (cadence in ('none', 'daily', 'weekly', 'monthly'));
