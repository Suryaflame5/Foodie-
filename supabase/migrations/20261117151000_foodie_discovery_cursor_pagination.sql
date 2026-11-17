create or replace function public.search_food_matches_page(
  p_city text,
  p_area text default null,
  p_query text default null,
  p_limit integer default 20,
  p_after_deadline timestamptz default null,
  p_after_id uuid default null
)
returns table(
  id uuid,
  title text,
  category text,
  description text,
  pickup_instructions text,
  storage_notes text,
  available_quantity integer,
  unit text,
  area text,
  city text,
  pickup_deadline timestamptz,
  image_path text,
  dietary_tags text[],
  donor_name text,
  donor_type text,
  food_prepared_at timestamptz,
  allergen_info text[]
)
language sql
stable
security definer
set search_path = public, pg_temp
as $function$
  select l.id, l.title, l.category, l.description,
         l.pickup_instructions, l.storage_notes,
         (l.quantity - l.reserved_quantity - l.collected_quantity),
         l.unit, l.area, l.city, l.pickup_deadline, l.image_path,
         l.dietary_tags, p.full_name, l.donor_type, l.food_prepared_at, l.allergen_info
  from public.food_listings l
  join public.profiles p on p.id = l.donor_id
  where l.status = 'available'
    and l.pickup_deadline > now()
    and l.quantity > l.reserved_quantity + l.collected_quantity
    and lower(l.city) = lower(p_city)
    and (p_area is null or lower(l.area) like '%' || lower(p_area) || '%')
    and (p_query is null or (l.title || ' ' || l.category || ' ' || l.description) ilike '%' || p_query || '%')
    and (p_after_deadline is null or (l.pickup_deadline, l.id) > (p_after_deadline, p_after_id))
  order by l.pickup_deadline asc, l.id asc
  limit greatest(1, least(p_limit, 20));
$function$;

revoke all on function public.search_food_matches_page(text,text,text,integer,timestamptz,uuid) from public;
grant execute on function public.search_food_matches_page(text,text,text,integer,timestamptz,uuid) to anon, authenticated, service_role;
