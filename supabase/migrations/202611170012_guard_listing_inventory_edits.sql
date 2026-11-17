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

  if new.collected_quantity is distinct from old.collected_quantity
     and coalesce(current_setting('foodie.reservation', true), '') <> 'on' then
    raise exception 'Collected quantity is managed by FOODIE';
  end if;

  if new.status is distinct from old.status
     and coalesce(current_setting('foodie.reservation', true), '') <> 'on' then
    if not ((old.status = 'available' and new.status = 'removed')
         or (old.status = 'removed' and new.status = 'available')) then
      raise exception 'Use the request workflow to change listing status';
    end if;
    if new.status = 'removed' and old.reserved_quantity > 0 then
      raise exception 'Resolve pending reservations before deactivating this listing';
    end if;
  end if;

  return new;
end;
$$;
