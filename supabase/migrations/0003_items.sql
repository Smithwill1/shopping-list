-- Phase 4: the items catalog.
--
-- `rank` is a float, not an integer, so drag-to-reorder can insert an item
-- between two neighbours by taking the midpoint of their ranks (e.g. moving
-- between 1000 and 2000 assigns 1500) without renumbering every other row.
-- The UI never lets a user type a rank directly — see src/items/rank.ts.

create table items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  price numeric(10, 2) check (price is null or price >= 0),
  rank double precision not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- Case-insensitive per-household uniqueness: "Bananas" and "bananas" collide.
create unique index items_household_name_unique on items (household_id, lower(name));

alter table items enable row level security;

create policy "members can view their household's items"
  on items for select
  using (is_household_member(household_id));

create policy "members can create items for their household"
  on items for insert
  with check (is_household_member(household_id) and created_by = auth.uid());

create policy "members can update their household's items"
  on items for update
  using (is_household_member(household_id));
