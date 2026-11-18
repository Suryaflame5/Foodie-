create table if not exists public.demo_showcase_organizations (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  organization_type text not null check (organization_type in ('donor','recipient')),
  category text not null,
  area text not null,
  city text not null default 'Chennai',
  description text not null default '',
  is_demo boolean not null default true check (is_demo),
  created_at timestamptz not null default now()
);
alter table public.demo_showcase_organizations enable row level security;
drop policy if exists "public read demo showcase organizations" on public.demo_showcase_organizations;
create policy "public read demo showcase organizations"
  on public.demo_showcase_organizations for select to anon, authenticated
  using (is_demo = true);
grant select on public.demo_showcase_organizations to anon, authenticated;

create table if not exists public.demo_showcase_activity (
  id uuid primary key default gen_random_uuid(),
  actor_name text not null,
  actor_type text not null check (actor_type in ('donor','recipient','community')),
  action_type text not null check (action_type in ('shared','requested','collected','matched')),
  item_label text not null,
  area text not null,
  city text not null default 'Chennai',
  quantity integer not null default 1 check (quantity > 0),
  unit text not null,
  description text not null default '',
  happened_at timestamptz not null default now(),
  is_demo boolean not null default true check (is_demo)
);
alter table public.demo_showcase_activity enable row level security;
drop policy if exists "public read demo showcase activity" on public.demo_showcase_activity;
create policy "public read demo showcase activity"
  on public.demo_showcase_activity for select to anon, authenticated
  using (is_demo = true);
grant select on public.demo_showcase_activity to anon, authenticated;
