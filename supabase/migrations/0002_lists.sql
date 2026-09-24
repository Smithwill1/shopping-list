-- Phase 3: lists.
--
-- Reuses is_household_member() from 0001_households.sql. Only select/insert
-- policies exist for now — editing/deleting a list isn't a stated
-- requirement yet, so there's no UI for it and no policy to support it.

create table lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  description text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table lists enable row level security;

create policy "members can view their household's lists"
  on lists for select
  using (is_household_member(household_id));

create policy "members can create lists for their household"
  on lists for insert
  with check (is_household_member(household_id) and created_by = auth.uid());
