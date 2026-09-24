-- Phase 2: households, membership, and invite codes.
--
-- RLS policies use a SECURITY DEFINER helper (is_household_member) to avoid
-- self-referential RLS recursion on household_members, and two further
-- SECURITY DEFINER RPCs (create_household, redeem_invite) so that creating
-- a household or joining one via invite code can atomically touch two
-- tables under a single auth check, without granting regular users direct
-- INSERT access to household_members.

create extension if not exists pgcrypto;

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  redeemed_by uuid references auth.users(id),
  redeemed_at timestamptz
);

alter table households enable row level security;
alter table household_members enable row level security;
alter table household_invites enable row level security;

create function is_household_member(p_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from household_members
    where household_id = p_household_id
      and user_id = auth.uid()
  );
$$;

grant execute on function is_household_member(uuid) to authenticated;

create policy "members can view their households"
  on households for select
  using (is_household_member(id));

create policy "members can update their households"
  on households for update
  using (is_household_member(id));

create policy "members can view their household's membership"
  on household_members for select
  using (is_household_member(household_id));

create policy "members can view their household's invites"
  on household_invites for select
  using (is_household_member(household_id));

create policy "members can create invites for their household"
  on household_invites for insert
  with check (is_household_member(household_id) and created_by = auth.uid());

-- No insert/update policies on households or household_members for regular
-- users: membership is only ever created through the two RPCs below, so a
-- household always has exactly one creator-member from the moment it exists.

create function create_household(p_name text)
returns households
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household households;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if trim(p_name) = '' then
    raise exception 'Household name is required';
  end if;

  insert into households (name, created_by)
  values (p_name, auth.uid())
  returning * into v_household;

  insert into household_members (household_id, user_id)
  values (v_household.id, auth.uid());

  return v_household;
end;
$$;

create function redeem_invite(p_code text)
returns households
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite household_invites;
  v_household households;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_invite
  from household_invites
  where code = p_code
    and redeemed_at is null
    and expires_at > now();

  if not found then
    raise exception 'Invalid or expired invite code';
  end if;

  insert into household_members (household_id, user_id)
  values (v_invite.household_id, auth.uid())
  on conflict (household_id, user_id) do nothing;

  update household_invites
  set redeemed_by = auth.uid(), redeemed_at = now()
  where id = v_invite.id;

  select * into v_household from households where id = v_invite.household_id;
  return v_household;
end;
$$;

revoke execute on function create_household(text) from public;
revoke execute on function redeem_invite(text) from public;
grant execute on function create_household(text) to authenticated;
grant execute on function redeem_invite(text) to authenticated;
