-- Migration: Create Pathly Schema
-- Purpose: Initialize the complete database schema for the Pathly application
-- Affected: Creates pathly schema, custom types, all tables, indexes, and RLS policies
-- Special considerations: This is the initial schema migration for the Pathly PWA

-- Create the pathly schema to separate application tables from Supabase internal schemas
create schema if not exists pathly;

-- Create custom enum types for the application
create type pathly.language_enum as enum ('pl', 'en');
create type pathly.theme_enum as enum ('light', 'dark', 'system');
create type pathly.analytics_event_type_enum as enum (
  'account_created', 
  'route_added', 
  'catalog_created', 
  'route_assigned_to_catalog'
);

-- Table: pathly.profiles
-- Purpose: Store user preferences and profile information linked to Supabase Auth users
create table pathly.profiles (
  id uuid primary key references auth.users on delete cascade,
  language pathly.language_enum not null default 'pl',
  theme pathly.theme_enum not null default 'system',
  created_at timestamptz not null default now()
);

-- Enable RLS on profiles table for user data protection
alter table pathly.profiles enable row level security;

-- Table: pathly.mountain_groups
-- Purpose: Store predefined mountain groups for route categorization
create table pathly.mountain_groups (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null unique,
  symbol varchar(40) not null unique
);

-- Enable RLS on mountain_groups table
alter table pathly.mountain_groups enable row level security;

-- Table: pathly.catalogs
-- Purpose: Store user-created and predefined route catalogs for organizing routes
create table pathly.catalogs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name varchar(255) not null,
  is_predefined boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on catalogs table for user data protection
alter table pathly.catalogs enable row level security;

-- Table: pathly.routes
-- Purpose: Store hiking route information with GOT points and GPX-derived data
create table pathly.routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name varchar(255) not null,
  route_date date not null,
  got_points smallint not null check (got_points >= 0),
  distance numeric(7, 2) not null check (distance >= 0),
  total_ascent numeric(6, 2) not null check (total_ascent >= 0),
  total_descent numeric(6, 2) not null check (total_descent >= 0),
  duration integer not null check (duration >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on routes table for user data protection
alter table pathly.routes enable row level security;

-- Table: pathly.route_catalogs
-- Purpose: Many-to-many relationship between routes and catalogs
create table pathly.route_catalogs (
  route_id uuid references pathly.routes on delete cascade,
  catalog_id uuid references pathly.catalogs on delete cascade,
  created_at timestamptz not null default now(),
  primary key (route_id, catalog_id)
);

-- Enable RLS on route_catalogs junction table
alter table pathly.route_catalogs enable row level security;

-- Table: pathly.route_mountain_groups
-- Purpose: Many-to-many relationship between routes and mountain groups
create table pathly.route_mountain_groups (
  route_id uuid references pathly.routes on delete cascade,
  mountain_group_id uuid references pathly.mountain_groups on delete restrict,
  created_at timestamptz not null default now(),
  primary key (route_id, mountain_group_id)
);

-- Enable RLS on route_mountain_groups junction table
alter table pathly.route_mountain_groups enable row level security;

-- Table: pathly.analytics_events
-- Purpose: Store analytics events for application usage tracking
create table pathly.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  event_type pathly.analytics_event_type_enum not null,
  created_at timestamptz not null default now()
);

-- Enable RLS on analytics_events table for user data protection
alter table pathly.analytics_events enable row level security;

-- Create custom indexes for performance optimization
-- Unique partial index on catalogs to prevent duplicate custom catalog names per user
create unique index idx_catalogs_user_custom_name 
on pathly.catalogs (user_id, name) 
where is_predefined = false;

-- Unique composite index on routes to prevent duplicate route names per user
create unique index idx_routes_user_name 
on pathly.routes (user_id, name);

-- RLS Policies for pathly.profiles
-- Policy: Users can select their own profile
create policy "Users can select own profile" on pathly.profiles
  for select using (auth.uid() = id);

-- Policy: Users can update their own profile
create policy "Users can update own profile" on pathly.profiles
  for update using (auth.uid() = id);

-- Policy: Users can insert their own profile (for profile creation)
create policy "Users can insert own profile" on pathly.profiles
  for insert with check (auth.uid() = id);

-- RLS Policies for pathly.mountain_groups
-- Policy: Anonymous users can select mountain groups (public data)
create policy "Anonymous users can select mountain groups" on pathly.mountain_groups
  for select to anon using (true);

-- Policy: Authenticated users can select mountain groups
create policy "Authenticated users can select mountain groups" on pathly.mountain_groups
  for select to authenticated using (true);

-- RLS Policies for pathly.catalogs
-- Policy: Users can select their own catalogs and predefined catalogs
create policy "Users can select own and predefined catalogs" on pathly.catalogs
  for select using (auth.uid() = user_id or is_predefined = true);

-- Policy: Users can insert their own catalogs
create policy "Users can insert own catalogs" on pathly.catalogs
  for insert with check (auth.uid() = user_id);

-- Policy: Users can update their own custom catalogs (not predefined ones)
create policy "Users can update own custom catalogs" on pathly.catalogs
  for update using (auth.uid() = user_id and is_predefined = false);

-- Policy: Users can delete their own custom catalogs (not predefined ones)
create policy "Users can delete own custom catalogs" on pathly.catalogs
  for delete using (auth.uid() = user_id and is_predefined = false);

-- RLS Policies for pathly.routes
-- Policy: Users can select their own routes
create policy "Users can select own routes" on pathly.routes
  for select using (auth.uid() = user_id);

-- Policy: Users can insert their own routes
create policy "Users can insert own routes" on pathly.routes
  for insert with check (auth.uid() = user_id);

-- Policy: Users can update their own routes
create policy "Users can update own routes" on pathly.routes
  for update using (auth.uid() = user_id);

-- Policy: Users can delete their own routes
create policy "Users can delete own routes" on pathly.routes
  for delete using (auth.uid() = user_id);

-- RLS Policies for pathly.route_catalogs
-- Policy: Users can select route-catalog associations for their own routes
create policy "Users can select own route catalogs" on pathly.route_catalogs
  for select using (
    exists (
      select 1 from pathly.routes 
      where routes.id = route_catalogs.route_id 
      and routes.user_id = auth.uid()
    )
  );

-- Policy: Users can insert route-catalog associations for their own routes
create policy "Users can insert own route catalogs" on pathly.route_catalogs
  for insert with check (
    exists (
      select 1 from pathly.routes 
      where routes.id = route_catalogs.route_id 
      and routes.user_id = auth.uid()
    )
  );

-- Policy: Users can delete route-catalog associations for their own routes
create policy "Users can delete own route catalogs" on pathly.route_catalogs
  for delete using (
    exists (
      select 1 from pathly.routes 
      where routes.id = route_catalogs.route_id 
      and routes.user_id = auth.uid()
    )
  );

-- RLS Policies for pathly.route_mountain_groups
-- Policy: Users can select route-mountain group associations for their own routes
create policy "Users can select own route mountain groups" on pathly.route_mountain_groups
  for select using (
    exists (
      select 1 from pathly.routes 
      where routes.id = route_mountain_groups.route_id 
      and routes.user_id = auth.uid()
    )
  );

-- Policy: Users can insert route-mountain group associations for their own routes
create policy "Users can insert own route mountain groups" on pathly.route_mountain_groups
  for insert with check (
    exists (
      select 1 from pathly.routes 
      where routes.id = route_mountain_groups.route_id 
      and routes.user_id = auth.uid()
    )
  );

-- Policy: Users can delete route-mountain group associations for their own routes
create policy "Users can delete own route mountain groups" on pathly.route_mountain_groups
  for delete using (
    exists (
      select 1 from pathly.routes 
      where routes.id = route_mountain_groups.route_id 
      and routes.user_id = auth.uid()
    )
  );

-- RLS Policies for pathly.analytics_events
-- Policy: Users can insert their own analytics events
create policy "Users can insert own analytics events" on pathly.analytics_events
  for insert with check (auth.uid() = user_id);

-- Policy: Users can select their own analytics events (restricted access for privacy)
create policy "Users can select own analytics events" on pathly.analytics_events
  for select using (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
create or replace function pathly.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers to automatically update updated_at columns
create trigger update_catalogs_updated_at
  before update on pathly.catalogs
  for each row execute function pathly.update_updated_at_column();

create trigger update_routes_updated_at
  before update on pathly.routes
  for each row execute function pathly.update_updated_at_column();
