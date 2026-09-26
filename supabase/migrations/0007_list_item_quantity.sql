-- Adds quantity to list_items, so "2x Milk" is one row with quantity 2,
-- not two separate rows. Existing rows default to 1 (unaffected).
--
-- quantity > 0 is enforced at the database level, not just in the UI:
-- "press - at quantity 1" removes the row entirely (see ListItemRow),
-- there's no such thing as a quantity-0 row that just sits there.

alter table list_items
  add column quantity integer not null default 1 check (quantity > 0);
