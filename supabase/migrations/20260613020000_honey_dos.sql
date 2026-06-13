-- Piece-Meal: Honey-Dos — a shared household checklist (chores, projects),
-- with freeform group labels per item (e.g. assignment by person).
-- Run this in the Supabase SQL editor before deploying the Honey-Dos
-- feature. Depends on the households tables and the is_household_member
-- helper from 20260612210000_households.sql.

create table if not exists public.honey_dos (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  group_name text not null default '',
  text text not null check (char_length(text) between 1 and 500),
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists honey_dos_household_idx
  on public.honey_dos (household_id);

alter table public.honey_dos enable row level security;

create policy "Members can view honey-dos"
  on public.honey_dos for select
  using (public.is_household_member(household_id));

create policy "Members can add honey-dos"
  on public.honey_dos for insert
  with check (public.is_household_member(household_id));

create policy "Members can update honey-dos"
  on public.honey_dos for update
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "Members can delete honey-dos"
  on public.honey_dos for delete
  using (public.is_household_member(household_id));
