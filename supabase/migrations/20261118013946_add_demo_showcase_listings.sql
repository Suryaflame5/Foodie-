alter table public.food_listings
  add column if not exists is_demo boolean not null default false;

comment on column public.food_listings.is_demo is
  'True only for illustrative showcase records. Exclude from real-world impact reporting.';

create or replace function public.search_food_matches(
  p_city text,
  p_area text default null,
  p_query text default null,
  p_limit integer default 8
)
returns table(
  id uuid, title text, category text, description text,
  pickup_instructions text, storage_notes text, available_quantity integer,
  unit text, area text, city text, pickup_deadline timestamp with time zone,
  image_path text, dietary_tags text[], donor_name text, donor_type text,
  food_prepared_at timestamp with time zone, allergen_info text[]
)
language sql stable security definer
set search_path to 'public'
as $function$
  select l.id, l.title, l.category, l.description,
         l.pickup_instructions, l.storage_notes,
         (l.quantity - l.reserved_quantity - l.collected_quantity),
         l.unit, l.area, l.city, l.pickup_deadline, l.image_path,
         l.dietary_tags,
         coalesce(l.donor_name, p.full_name, 'Community donor'),
         l.donor_type, l.food_prepared_at, l.allergen_info
  from public.food_listings l
  left join public.profiles p on p.id = l.donor_id
  where l.status = 'available'
    and l.pickup_deadline > now()
    and l.quantity > l.reserved_quantity + l.collected_quantity
    and lower(l.city) = lower(p_city)
    and (p_area is null or lower(l.area) like '%' || lower(p_area) || '%')
    and (p_query is null or (l.title || ' ' || l.category || ' ' || l.description) ilike '%' || p_query || '%')
  order by l.pickup_deadline asc
  limit greatest(1, least(p_limit, 20));
$function$;

drop function if exists public.search_food_matches_page(text, text, text, integer, timestamp with time zone, uuid);

create function public.search_food_matches_page(
  p_city text,
  p_area text default null,
  p_query text default null,
  p_limit integer default 20,
  p_after_deadline timestamp with time zone default null,
  p_after_id uuid default null
)
returns table(
  id uuid, title text, category text, description text,
  pickup_instructions text, storage_notes text, available_quantity integer,
  unit text, area text, city text, pickup_deadline timestamp with time zone,
  image_path text, dietary_tags text[], donor_name text, donor_type text,
  food_prepared_at timestamp with time zone, allergen_info text[], is_demo boolean
)
language sql stable security definer
set search_path to 'public', 'pg_temp'
as $function$
  select l.id, l.title, l.category, l.description,
         l.pickup_instructions, l.storage_notes,
         (l.quantity - l.reserved_quantity - l.collected_quantity),
         l.unit, l.area, l.city, l.pickup_deadline, l.image_path,
         l.dietary_tags,
         coalesce(l.donor_name, p.full_name, 'Community donor'),
         l.donor_type, l.food_prepared_at, l.allergen_info, l.is_demo
  from public.food_listings l
  left join public.profiles p on p.id = l.donor_id
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

grant execute on function public.search_food_matches_page(text, text, text, integer, timestamp with time zone, uuid) to anon, authenticated;
