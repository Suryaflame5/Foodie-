-- Harden legacy reservation RPCs while preserving their authenticated signatures.
-- These functions are SECURITY DEFINER because they update donor inventory on behalf
-- of an authenticated requester. Identity and state transitions are enforced here.

create or replace function public.reserve_food_listing(
  p_listing_id uuid,
  p_requester_id uuid,
  p_quantity integer,
  p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_listing public.food_listings;
  v_new_reserved integer;
  v_new_status public.food_status;
  v_request_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_requester_id is distinct from auth.uid() then
    raise exception 'Requester must match the authenticated user';
  end if;
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Quantity must be at least one';
  end if;

  select * into v_listing
  from public.food_listings
  where id = p_listing_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Food listing not found');
  end if;
  if v_listing.donor_id = auth.uid() then
    raise exception 'You cannot request your own listing';
  end if;
  if v_listing.status <> 'available' or v_listing.pickup_deadline <= now() then
    return jsonb_build_object('success', false, 'error', 'Listing is no longer available');
  end if;
  if v_listing.quantity - v_listing.reserved_quantity - v_listing.collected_quantity < p_quantity then
    return jsonb_build_object(
      'success', false,
      'error', format('Only %s %s remaining', v_listing.quantity - v_listing.reserved_quantity - v_listing.collected_quantity, v_listing.unit)
    );
  end if;

  v_new_reserved := v_listing.reserved_quantity + p_quantity;
  v_new_status := case
    when v_listing.quantity - v_new_reserved - v_listing.collected_quantity = 0
      then 'reserved'::public.food_status
    else 'available'::public.food_status
  end;

  perform set_config('foodie.reservation', 'on', true);
  update public.food_listings
  set reserved_quantity = v_new_reserved,
      status = v_new_status,
      updated_at = now()
  where id = p_listing_id;

  insert into public.food_requests(listing_id, requester_id, quantity, status, note)
  values (p_listing_id, auth.uid(), p_quantity, 'accepted', left(coalesce(p_note, ''), 1000))
  returning id into v_request_id;

  return jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'remaining_quantity', v_listing.quantity - v_new_reserved - v_listing.collected_quantity,
    'status', v_new_status
  );
end;
$function$;

create or replace function public.cancel_food_request(
  p_request_id uuid,
  p_requester_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_req public.food_requests;
  v_listing public.food_listings;
  v_remaining integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_requester_id is distinct from auth.uid() then
    raise exception 'Requester must match the authenticated user';
  end if;

  select * into v_req
  from public.food_requests
  where id = p_request_id
    and requester_id = auth.uid()
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Request not found');
  end if;
  if v_req.status <> 'pending' then
    return jsonb_build_object('success', false, 'error', 'Only pending requests can be cancelled');
  end if;

  select * into v_listing
  from public.food_listings
  where id = v_req.listing_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Food listing not found');
  end if;

  v_remaining := greatest(0, v_listing.reserved_quantity - v_req.quantity);
  perform set_config('foodie.reservation', 'on', true);

  update public.food_requests
  set status = 'cancelled',
      updated_at = now()
  where id = p_request_id;

  update public.food_listings
  set reserved_quantity = v_remaining,
      status = case
        when status = 'reserved' and quantity - v_remaining - collected_quantity > 0
          then 'available'::public.food_status
        else status
      end,
      updated_at = now()
  where id = v_req.listing_id;

  return jsonb_build_object('success', true);
end;
$function$;

revoke all on function public.reserve_food_listing(uuid, uuid, integer, text) from public, anon, authenticated;
grant execute on function public.reserve_food_listing(uuid, uuid, integer, text) to authenticated, service_role;
revoke all on function public.cancel_food_request(uuid, uuid) from public, anon, authenticated;
grant execute on function public.cancel_food_request(uuid, uuid) to authenticated, service_role;
