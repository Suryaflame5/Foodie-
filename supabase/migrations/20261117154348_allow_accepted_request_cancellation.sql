-- Keep legacy cancellation compatible with accepted reservations while enforcing ownership.
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
  if v_req.status not in ('pending', 'accepted') then
    return jsonb_build_object('success', false, 'error', 'This request can no longer be cancelled');
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
