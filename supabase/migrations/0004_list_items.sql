-- Phase 5: putting items on a list.
--
-- item_id is nullable: Req-05's "add to list only" option must NOT save
-- the item to the catalog, so that path stores its own name (and no
-- price) directly on the row instead of linking to `items`. The "add and
-- save for later" path links item_id to a real catalog row instead. The
-- app resolves each row's effective name/price/rank by preferring the
-- joined item when item_id is set, falling back to the row's own name
-- otherwise (see src/list-items/useListItems.ts).
--
-- Unlike `lists` and `items`, this table gets a delete policy: Req-14
-- (swipe to remove) is a real, explicit requirement here.

create table list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists(id) on delete cascade,
  item_id uuid references items(id) on delete cascade,
  name text,
  price numeric(10, 2) check (price is null or price >= 0),
  done boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (item_id is not null or name is not null)
);

alter table list_items enable row level security;

create policy "members can view their household's list items"
  on list_items for select
  using (
    exists (
      select 1 from lists
      where lists.id = list_items.list_id
        and is_household_member(lists.household_id)
    )
  );

create policy "members can add items to their household's lists"
  on list_items for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from lists
      where lists.id = list_items.list_id
        and is_household_member(lists.household_id)
    )
  );

create policy "members can update items on their household's lists"
  on list_items for update
  using (
    exists (
      select 1 from lists
      where lists.id = list_items.list_id
        and is_household_member(lists.household_id)
    )
  );

create policy "members can remove items from their household's lists"
  on list_items for delete
  using (
    exists (
      select 1 from lists
      where lists.id = list_items.list_id
        and is_household_member(lists.household_id)
    )
  );
