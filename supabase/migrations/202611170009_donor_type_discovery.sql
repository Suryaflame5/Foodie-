alter table public.food_listings
  add column if not exists donor_type text not null default 'Individual';

drop function if exists public.search_food_matches(text,text,text,integer);
create function public.search_food_matches(
  p_city text,
  p_area text default null,
  p_query text default null,
  p_limit integer default 8
)
returns table(
  id uuid, title text, category text, description text, available_quantity integer,
  unit text, area text, city text, pickup_deadline timestamptz,
  image_path text, dietary_tags text[], donor_name text, donor_type text
)
language sql stable security definer set search_path = public
as $$
  select l.id, l.title, l.category, l.description,
         (l.quantity - l.reserved_quantity - l.collected_quantity),
         l.unit, l.area, l.city, l.pickup_deadline, l.image_path,
         l.dietary_tags, p.full_name, l.donor_type
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
revoke all on function public.search_food_matches(text,text,text,integer) from public;
grant execute on function public.search_food_matches(text,text,text,integer) to anon, authenticated;
