-- Keep listing status transitions narrow for donor edits.
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
     and not ((old.status = 'available' and new.status = 'removed')
           or (old.status = 'removed' and new.status = 'available')) then
    raise exception 'Use the request workflow to change listing status';
  end if;
  return new;
end;
$$;

-- Release a reservation when a requester cancels or a donor rejects it.
-- On collection, convert the reserved quantity into collected quantity.
create or replace function public.sync_listing_after_request_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_release integer;
begin
  if old.status = new.status then return new; end if;

  if new.status in ('cancelled', 'rejected', 'collected') then
    v_release := old.quantity;
    perform set_config('foodie.reservation', 'on', true);

    if new.status = 'collected' then
      update public.food_listings
      set quantity = greatest(0, quantity - v_release),
          reserved_quantity = greatest(0, reserved_quantity - v_release),
          status = case
            when quantity - v_release <= 0 then 'collected'::public.food_status
            when quantity - reserved_quantity > 0 then 'available'::public.food_status
            else 'reserved'::public.food_status
          end,
          updated_at = now()
      where id = new.listing_id;
    else
      update public.food_listings
      set reserved_quantity = greatest(0, reserved_quantity - v_release),
          status = case
            when status = 'reserved' and quantity - (reserved_quantity - v_release) > 0
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

drop trigger if exists sync_listing_after_request_change on public.food_requests;
create trigger sync_listing_after_request_change
after update on public.food_requests
for each row execute function public.sync_listing_after_request_change();
