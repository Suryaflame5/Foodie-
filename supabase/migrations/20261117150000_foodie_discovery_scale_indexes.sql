create extension if not exists pg_trgm with schema extensions;

-- Match the live discovery query: case-insensitive city, earliest pickup first.
create index if not exists food_listings_live_city_deadline_idx
  on public.food_listings (lower(city), pickup_deadline, id)
  where status = 'available';

-- Support contains-style area and keyword searches used by search_food_matches.
create index if not exists food_listings_area_trgm_idx
  on public.food_listings using gin (lower(area) extensions.gin_trgm_ops);

create index if not exists food_listings_search_trgm_idx
  on public.food_listings using gin (
    (title || ' ' || category || ' ' || description) extensions.gin_trgm_ops
  );

analyze public.food_listings;
