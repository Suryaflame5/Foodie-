-- Track collected food separately so a completed pickup never makes the same quantity available again.
alter table public.food_listings
  add column if not exists collected_quantity integer not null default 0
  check (collected_quantity >= 0);

alter table public.food_listings
  drop constraint if exists food_listings_reserved_quantity_check;
alter table public.food_listings
  add constraint food_listings_inventory_check
  check (reserved_quantity >= 0
     and collected_quantity >= 0
     and reserved_quantity + collected_quantity <= quantity);

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

  select * into v_listing from public.food_listings where id = p_listing_id for update;
  if not found or v_listing.status <> 'available' or v_listing.pickup_deadline <= now() then
    raise exception 'This food is no longer available';
  end if;
  if v_listing.donor_id = auth.uid() then raise exception 'You cannot request your own listing'; end if;
  if v_listing.quantity - v_listing.reserved_quantity - v_listing.collected_quantity < p_quantity then
    raise exception 'Not enough quantity remains';
  end if;

  perform set_config('foodie.reservation', 'on', true);
  update public.food_listings
  set reserved_quantity = reserved_quantity + p_quantity,
      status = case
        when quantity - reserved_quantity - collected_quantity - p_quantity = 0
          then 'reserved'::public.food_status
        else status
      end,
      updated_at = now()
  where id = p_listing_id;

  insert into public.food_requests(listing_id, requester_id, quantity, note)
  values (p_listing_id, auth.uid(), p_quantity, left(coalesce(p_note, ''), 1000))
  returning * into v_request;
  return v_request;
end;
$$;

create or replace function public.search_food_matches(
  p_city text,
  p_area text default null,
  p_query text default null,
  p_limit integer default 8
)
returns table(
  id uuid, title text, category text, description text, available_quantity integer,
  unit text, area text, city text, pickup_deadline timestamptz,
  image_path text, dietary_tags text[], donor_name text
)
language sql stable security definer set search_path = public
as $$
  select l.id, l.title, l.category, l.description,
         (l.quantity - l.reserved_quantity - l.collected_quantity),
         l.unit, l.area, l.city, l.pickup_deadline, l.image_path,
         l.dietary_tags, p.full_name
  from public.food_listings l
  join public.profiles p on p.id = l.donor_id
  where l.status = 'available'
    and l.pickup_deadline > now()
    and l.quantity > l.reserved_quantity + l.collected_quantity
    and lower(l.city) = lower(p_city)
    and (p_area is null or lower(l.area) like '%' || lower(p_area) || '%')
    and (p_query is null or (l.title || ' ' || l.category || ' ' || l.description) ilike '%' || p_query || '%')
  order by l.pickup_deadline asc
  limit greatest(1, least(p_limit, 20));
$$;

create or replace function public.sync_listing_after_request_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = new.status then return new; end if;

  if new.status in ('cancelled', 'rejected', 'collected') then
    perform set_config('foodie.reservation', 'on', true);

    if new.status = 'collected' then
      update public.food_listings
      set reserved_quantity = greatest(0, reserved_quantity - old.quantity),
          collected_quantity = collected_quantity + old.quantity,
          status = case
            when quantity - (reserved_quantity - old.quantity) - (collected_quantity + old.quantity) > 0
              then 'available'::public.food_status
            when reserved_quantity - old.quantity > 0
              then 'reserved'::public.food_status
            else 'collected'::public.food_status
          end,
          updated_at = now()
      where id = new.listing_id;
    else
      update public.food_listings
      set reserved_quantity = greatest(0, reserved_quantity - old.quantity),
          status = case
            when status = 'reserved'
             and quantity - (reserved_quantity - old.quantity) - collected_quantity > 0
              then 'available'::public.food_status
            else status
          end,
          updated_at = now()
      where id = new.listing_id;
    end if;
  end if;
  return new;
end;
$$;
