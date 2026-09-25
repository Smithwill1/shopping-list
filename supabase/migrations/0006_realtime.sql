-- Phase 10: enable Realtime on the two tables where seeing your partner's
-- changes live actually matters — a new list appearing, and items being
-- added/checked off while shopping together. Supabase Realtime only
-- broadcasts Postgres changes for tables explicitly added to this
-- publication; RLS still applies, so a client only receives change events
-- for rows its own policies would let it select anyway.
--
-- Deliberately NOT added here: items, groups, group_items. Editing your
-- catalog or meal list isn't a moment-to-moment shared activity the way
-- shopping together is — nothing in the requirements asked for it, and
-- adding it "for completeness" would be scope creep without a use case.

alter publication supabase_realtime add table public.lists;
alter publication supabase_realtime add table public.list_items;
