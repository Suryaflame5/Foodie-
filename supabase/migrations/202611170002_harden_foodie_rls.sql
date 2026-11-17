-- Tighten authorization after the initial FOODIE schema.
-- Profile phone numbers are private; public donor display names are returned only by the discovery RPC.
drop policy if exists "profiles readable by members" on public.profiles;
create policy "members read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

-- Inventory is changed only by the atomic reservation RPC. Donors may edit listing details,
-- but cannot manufacture reservations or mark food collected without a request workflow.
create or replace function public.guard_food_listing_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.donor_id <> old.donor_id then
    raise exception 'Listing ownership cannot be changed';
  end if;

  if new.reserved_quantity is distinct from old.reserved_quantity
     and coalesce(current_setting('foodie.reservation', true), '') <> 'on' then
    raise exception 'Reserved quantity is managed by FOODIE';
  end if;

  if new.status is distinct from old.status
     and coalesce(current_setting('foodie.reservation', true), '') <> 'on'
     and new.status not in ('available', 'removed') then
    raise exception 'Use the request workflow to change listing status';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_food_listing_update on public.food_listings;
create trigger guard_food_listing_update
before update on public.food_listings
for each row execute function public.guard_food_listing_update();

create or replace function public.reserve_food(p_listing_id uuid, p_quantity integer, p_note text default '')
returns public.food_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.food_listings;
  v_request public.food_requests;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_quantity is null or p_quantity < 1 then raise exception 'Quantity must be at least one'; end if;

  select * into v_listing
  from public.food_listings
  where id = p_listing_id
  for update;

  if not found or v_listing.status <> 'available' or v_listing.pickup_deadline <= now() then
    raise exception 'This food is no longer available';
  end if;
  if v_listing.donor_id = auth.uid() then raise exception 'You cannot request your own listing'; end if;
  if v_listing.quantity - v_listing.reserved_quantity < p_quantity then
    raise exception 'Not enough quantity remains';
  end if;

  perform set_config('foodie.reservation', 'on', true);
  update public.food_listings
  set reserved_quantity = reserved_quantity + p_quantity,
      status = case when quantity - reserved_quantity - p_quantity = 0
                    then 'reserved'::public.food_status else status end,
      updated_at = now()
  where id = p_listing_id;

  insert into public.food_requests(listing_id, requester_id, quantity, note)
  values (p_listing_id, auth.uid(), p_quantity, left(coalesce(p_note, ''), 1000))
  returning * into v_request;

  return v_request;
end;
$$;

-- Request participants may change only the request status, never its owner, listing or quantity.
create or replace function public.guard_food_request_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.id <> old.id
     or new.listing_id <> old.listing_id
     or new.requester_id <> old.requester_id
     or new.quantity <> old.quantity
     or new.note <> old.note then
    raise exception 'Request details cannot be changed after submission';
  end if;

  if auth.uid() = old.requester_id then
    if old.status <> 'pending' or new.status not in ('pending', 'cancelled') then
      raise exception 'You can only cancel a pending request';
    end if;
  elsif exists (
    select 1 from public.food_listings l
    where l.id = old.listing_id and l.donor_id = auth.uid()
  ) then
    if new.status not in ('pending', 'accepted', 'rejected', 'collected') then
      raise exception 'Invalid donor status change';
    end if;
  else
    raise exception 'Not allowed to update this request';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists guard_food_request_update on public.food_requests;
create trigger guard_food_request_update
before update on public.food_requests
for each row execute function public.guard_food_request_update();

-- Do not allow anonymous callers to create conversation records or messages.
revoke all on public.companion_conversations, public.companion_messages from anon;
