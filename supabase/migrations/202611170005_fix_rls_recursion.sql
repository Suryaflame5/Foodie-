-- Avoid recursive RLS evaluation between food_listings and food_requests.
create or replace function public.can_view_requested_listing(p_listing_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.food_requests r
    where r.listing_id = p_listing_id and r.requester_id = auth.uid()
  );
$$;

create or replace function public.can_view_food_request(p_listing_id uuid, p_requester_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select p_requester_id = auth.uid()
      or exists (
        select 1 from public.food_listings l
        where l.id = p_listing_id and l.donor_id = auth.uid()
      );
$$;

revoke all on function public.can_view_requested_listing(uuid) from public, anon;
revoke all on function public.can_view_food_request(uuid, uuid) from public, anon;
grant execute on function public.can_view_requested_listing(uuid) to authenticated;
grant execute on function public.can_view_food_request(uuid, uuid) to authenticated;

drop policy if exists "requesters see their reserved listings" on public.food_listings;
create policy "requesters see their reserved listings" on public.food_listings
  for select to authenticated using (public.can_view_requested_listing(id));

drop policy if exists "requesters and donors view requests" on public.food_requests;
create policy "requesters and donors view requests" on public.food_requests
  for select to authenticated using (public.can_view_food_request(listing_id, requester_id));
