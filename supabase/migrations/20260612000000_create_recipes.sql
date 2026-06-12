-- PieceMeal: recipes table with row-level security.
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  ingredients text[] not null default '{}',
  instructions text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists recipes_user_id_idx on public.recipes (user_id);

alter table public.recipes enable row level security;

create policy "Users can view their own recipes"
  on public.recipes for select
  using ((select auth.uid()) = user_id);

create policy "Users can add their own recipes"
  on public.recipes for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own recipes"
  on public.recipes for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own recipes"
  on public.recipes for delete
  using ((select auth.uid()) = user_id);
