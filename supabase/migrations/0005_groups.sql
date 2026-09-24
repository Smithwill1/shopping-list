-- Phase 7: groups (meals) — reusable bundles of catalog items.
--
-- Unlike list_items (Phase 5), group_items.item_id is NOT nullable: a
-- group is explicitly built from the existing catalog (Req-06's example
-- — "Pizza bases, base sauce, pepperoni, cheese" — is all catalog items),
-- so there's no "ad hoc, not saved" path here the way Req-05 gave lists.
-- If an item doesn't exist yet, it's added to the catalog first (Items
-- screen), then to the group — a deliberate scope decision, not an
-- oversight, since nothing in Req-06 asked for a quick-add-new-item path.

create table groups (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create unique index groups_household_name_unique on groups (household_id, lower(name));

alter table groups enable row level security;

create policy "members can view their household's groups"
  on groups for select
  using (is_household_member(household_id));

create policy "members can create groups for their household"
  on groups for insert
  with check (is_household_member(household_id) and created_by = auth.uid());

create policy "members can rename their household's groups"
  on groups for update
  using (is_household_member(household_id));

create table group_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (group_id, item_id)
);

alter table group_items enable row level security;

create policy "members can view their household's group items"
  on group_items for select
  using (
    exists (
      select 1 from groups
      where groups.id = group_items.group_id
        and is_household_member(groups.household_id)
    )
  );

create policy "members can add items to their household's groups"
  on group_items for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from groups
      where groups.id = group_items.group_id
        and is_household_member(groups.household_id)
    )
  );

create policy "members can remove items from their household's groups"
  on group_items for delete
  using (
    exists (
      select 1 from groups
      where groups.id = group_items.group_id
        and is_household_member(groups.household_id)
    )
  );
