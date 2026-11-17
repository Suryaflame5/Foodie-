-- Index the foreign-key access paths used by the companion and saved-food screens.
create index if not exists companion_conversations_user_created_idx on public.companion_conversations(user_id, created_at desc);
create index if not exists companion_messages_user_idx on public.companion_messages(user_id);
create index if not exists saved_listings_listing_idx on public.saved_listings(listing_id);

-- Keep auth.uid() as a statement-level initplan and avoid recursive policy checks.
create or replace function private.can_view_requested_listing(p_listing_id uuid)
returns boolean
language sql stable security definer
set search_path = public, private
as $$
  select exists (
    select 1 from public.food_requests r
    where r.listing_id = p_listing_id and r.requester_id = (select auth.uid())
  );
$$;

create or replace function private.can_view_food_request(p_listing_id uuid, p_requester_id uuid)
returns boolean
language sql stable security definer
set search_path = public, private
as $$
  select p_requester_id = (select auth.uid())
      or exists (
        select 1 from public.food_listings l
        where l.id = p_listing_id and l.donor_id = (select auth.uid())
      );
$$;

-- Anonymous visitors can only discover available listings. Members additionally see their
-- own listings and listings connected to their requests.
drop policy if exists "discover available listings" on public.food_listings;
drop policy if exists "requesters see their reserved listings" on public.food_listings;
create policy "public discover available listings" on public.food_listings
  for select to anon using (status = 'available');
create policy "members discover and access own listings" on public.food_listings
  for select to authenticated
  using (
    status = 'available'
    or donor_id = (select auth.uid())
    or private.can_view_requested_listing(id)
  );

drop policy if exists "donors manage request status" on public.food_requests;
drop policy if exists "requester cancels pending" on public.food_requests;
create policy "participants update their requests" on public.food_requests
  for update to authenticated
  using (
    (requester_id = (select auth.uid()) and status = 'pending')
    or private.can_view_food_request(listing_id, null)
  )
  with check (
    (requester_id = (select auth.uid()) and status in ('pending','cancelled'))
    or (
      private.can_view_food_request(listing_id, null)
      and status in ('pending','accepted','rejected','collected')
    )
  );

drop policy if exists "insert own profile" on public.profiles;
revoke insert on public.profiles from authenticated;
drop policy if exists "members read own profile" on public.profiles;
create policy "members read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "create own safe listings" on public.food_listings;
create policy "create own safe listings" on public.food_listings
  for insert to authenticated with check (donor_id = (select auth.uid()) and safety_confirmed = true);
drop policy if exists "update own listings" on public.food_listings;
create policy "update own listings" on public.food_listings
  for update to authenticated using (donor_id = (select auth.uid())) with check (donor_id = (select auth.uid()));
drop policy if exists "delete own listings" on public.food_listings;
create policy "delete own listings" on public.food_listings
  for delete to authenticated using (donor_id = (select auth.uid()));

drop policy if exists "create own requests" on public.food_requests;
create policy "create own requests" on public.food_requests
  for insert to authenticated with check (requester_id = (select auth.uid()));

drop policy if exists "manage own saved listings" on public.saved_listings;
create policy "manage own saved listings" on public.saved_listings
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "manage own conversations" on public.companion_conversations;
create policy "manage own conversations" on public.companion_conversations
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "manage own messages" on public.companion_messages;
create policy "manage own messages" on public.companion_messages
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
