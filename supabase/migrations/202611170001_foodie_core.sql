create extension if not exists pgcrypto;
create type public.food_status as enum ('available','reserved','collected','expired','removed');
create type public.request_status as enum ('pending','accepted','rejected','cancelled','collected');
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null, phone text,
 preferred_language text not null default 'en' check(preferred_language in ('en','ta','te')),
 role text not null default 'member' check(role in ('member','donor','organisation','admin')),
 area text, city text not null default 'Chennai',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.food_listings (
 id uuid primary key default gen_random_uuid(),
 donor_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check(length(trim(title)) between 3 and 120),
 category text not null, description text not null default '',
 quantity integer not null check(quantity>0 and quantity<=100000),
 unit text not null, reserved_quantity integer not null default 0 check(reserved_quantity>=0),
 area text not null, city text not null, pickup_instructions text not null default '',
 pickup_deadline timestamptz not null, image_path text,
 dietary_tags text[] not null default '{}', allergen_info text[] not null default '{}',
 food_prepared_at timestamptz, storage_notes text not null default '',
 status public.food_status not null default 'available',
 safety_confirmed boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(reserved_quantity<=quantity), check(pickup_deadline>created_at)
);
create index food_listings_discovery_idx on public.food_listings(status,city,area,pickup_deadline);
create index food_listings_donor_idx on public.food_listings(donor_id,created_at desc);
create table public.food_requests (
 id uuid primary key default gen_random_uuid(),
 listing_id uuid not null references public.food_listings(id) on delete restrict,
 requester_id uuid not null references public.profiles(id) on delete cascade,
 quantity integer not null check(quantity>0), status public.request_status not null default 'pending',
 note text not null default '', created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index food_requests_user_idx on public.food_requests(requester_id,created_at desc);
create index food_requests_listing_idx on public.food_requests(listing_id,status);
create table public.saved_listings (
 user_id uuid not null references public.profiles(id) on delete cascade,
 listing_id uuid not null references public.food_listings(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,listing_id)
);
create table public.companion_conversations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 language text not null default 'en' check(language in ('en','ta','te')),
 title text not null default 'Food companion', created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.companion_messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references public.companion_conversations(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 role text not null check(role in ('user','assistant')),
 content text not null check(length(content)<=6000),
 language text not null default 'en' check(language in ('en','ta','te')),
 created_at timestamptz not null default now()
);
create index companion_messages_conversation_idx on public.companion_messages(conversation_id,created_at);
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,full_name,preferred_language)
 values(new.id,coalesce(nullif(new.raw_user_meta_data->>'full_name',''),split_part(new.email,'@',1),'Foodie member'),
 coalesce(nullif(new.raw_user_meta_data->>'preferred_language',''),'en'));
 return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create or replace function public.reserve_food(p_listing_id uuid,p_quantity integer,p_note text default '')
returns public.food_requests language plpgsql security definer set search_path=public as $$
declare v_listing public.food_listings; v_request public.food_requests;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_quantity<1 then raise exception 'Quantity must be at least one'; end if;
 select * into v_listing from public.food_listings where id=p_listing_id for update;
 if not found or v_listing.status<>'available' or v_listing.pickup_deadline<=now() then raise exception 'This food is no longer available'; end if;
 if v_listing.donor_id=auth.uid() then raise exception 'You cannot request your own listing'; end if;
 if v_listing.quantity-v_listing.reserved_quantity<p_quantity then raise exception 'Not enough quantity remains'; end if;
 update public.food_listings set reserved_quantity=reserved_quantity+p_quantity,
 status=case when quantity-reserved_quantity-p_quantity=0 then 'reserved'::public.food_status else status end,
 updated_at=now() where id=p_listing_id;
 insert into public.food_requests(listing_id,requester_id,quantity,note)
 values(p_listing_id,auth.uid(),p_quantity,left(coalesce(p_note,''),1000)) returning * into v_request;
 return v_request;
end; $$;
revoke all on function public.reserve_food(uuid,integer,text) from public;
grant execute on function public.reserve_food(uuid,integer,text) to authenticated;
create or replace function public.search_food_matches(p_city text,p_area text default null,p_query text default null,p_limit integer default 8)
returns table(id uuid,title text,category text,description text,available_quantity integer,unit text,area text,city text,
 pickup_deadline timestamptz,image_path text,dietary_tags text[],donor_name text)
language sql stable security invoker set search_path=public as $$
 select l.id,l.title,l.category,l.description,(l.quantity-l.reserved_quantity),l.unit,l.area,l.city,
 l.pickup_deadline,l.image_path,l.dietary_tags,p.full_name
 from public.food_listings l join public.profiles p on p.id=l.donor_id
 where l.status='available' and l.pickup_deadline>now() and l.quantity>l.reserved_quantity
 and lower(l.city)=lower(p_city)
 and (p_area is null or lower(l.area) like '%'||lower(p_area)||'%')
 and (p_query is null or (l.title||' '||l.category||' '||l.description) ilike '%'||p_query||'%')
 order by l.pickup_deadline asc limit greatest(1,least(p_limit,20));
$$;
grant execute on function public.search_food_matches(text,text,text,integer) to anon,authenticated;
alter table public.profiles enable row level security;
alter table public.food_listings enable row level security;
alter table public.food_requests enable row level security;
alter table public.saved_listings enable row level security;
alter table public.companion_conversations enable row level security;
alter table public.companion_messages enable row level security;
create policy "profiles readable by members" on public.profiles for select to authenticated using(true);
create policy "insert own profile" on public.profiles for insert to authenticated with check(id=auth.uid());
create policy "update own profile" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy "discover available listings" on public.food_listings for select to anon,authenticated using(status='available' or donor_id=auth.uid());
create policy "create own safe listings" on public.food_listings for insert to authenticated with check(donor_id=auth.uid() and safety_confirmed=true);
create policy "update own listings" on public.food_listings for update to authenticated using(donor_id=auth.uid()) with check(donor_id=auth.uid());
create policy "delete own listings" on public.food_listings for delete to authenticated using(donor_id=auth.uid());
create policy "requesters and donors view requests" on public.food_requests for select to authenticated
 using(requester_id=auth.uid() or exists(select 1 from public.food_listings l where l.id=listing_id and l.donor_id=auth.uid()));
create policy "create own requests" on public.food_requests for insert to authenticated with check(requester_id=auth.uid());
create policy "requester cancels pending" on public.food_requests for update to authenticated
 using(requester_id=auth.uid() and status='pending') with check(requester_id=auth.uid() and status in ('pending','cancelled'));
create policy "manage own saved listings" on public.saved_listings for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "manage own conversations" on public.companion_conversations for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "manage own messages" on public.companion_messages for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('food-images','food-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "public view food photos" on storage.objects for select using(bucket_id='food-images');
create policy "upload own food photos" on storage.objects for insert to authenticated
 with check(bucket_id='food-images' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "update own food photos" on storage.objects for update to authenticated
 using(bucket_id='food-images' and (storage.foldername(name))[1]=auth.uid()::text)
 with check(bucket_id='food-images' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "delete own food photos" on storage.objects for delete to authenticated
 using(bucket_id='food-images' and (storage.foldername(name))[1]=auth.uid()::text);
