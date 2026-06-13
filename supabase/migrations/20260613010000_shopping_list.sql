-- Piece-Meal: a per-user shopping list.
-- Unlike recipes, shopping lists are NOT shared across a household — each
-- person keeps their own, visible and editable only by them. Run this in
-- the Supabase SQL editor before deploying the shopping-list version.

create table if not exists public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists shopping_list_items_user_id_idx
  on public.shopping_list_items (user_id);

alter table public.shopping_list_items enable row level security;

create policy "View your own shopping items"
  on public.shopping_list_items for select
  using ((select auth.uid()) = user_id);

create policy "Add your own shopping items"
  on public.shopping_list_items for insert
  with check ((select auth.uid()) = user_id);

create policy "Update your own shopping items"
  on public.shopping_list_items for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Delete your own shopping items"
  on public.shopping_list_items for delete
  using ((select auth.uid()) = user_id);
