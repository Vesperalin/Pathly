-- Migration: Disable All RLS Policies
-- Purpose: Disable all Row Level Security policies created in the initial schema migration
-- Affected: Drops all RLS policies from pathly schema tables
-- Special considerations: This removes all access control policies - use with caution

-- Drop RLS Policies for pathly.profiles
drop policy if exists "Users can select own profile" on pathly.profiles;
drop policy if exists "Users can update own profile" on pathly.profiles;
drop policy if exists "Users can insert own profile" on pathly.profiles;

-- Drop RLS Policies for pathly.mountain_groups
drop policy if exists "Anonymous users can select mountain groups" on pathly.mountain_groups;
drop policy if exists "Authenticated users can select mountain groups" on pathly.mountain_groups;

-- Drop RLS Policies for pathly.catalogs
drop policy if exists "Users can select own and predefined catalogs" on pathly.catalogs;
drop policy if exists "Users can insert own catalogs" on pathly.catalogs;
drop policy if exists "Users can update own custom catalogs" on pathly.catalogs;
drop policy if exists "Users can delete own custom catalogs" on pathly.catalogs;

-- Drop RLS Policies for pathly.routes
drop policy if exists "Users can select own routes" on pathly.routes;
drop policy if exists "Users can insert own routes" on pathly.routes;
drop policy if exists "Users can update own routes" on pathly.routes;
drop policy if exists "Users can delete own routes" on pathly.routes;

-- Drop RLS Policies for pathly.route_catalogs
drop policy if exists "Users can select own route catalogs" on pathly.route_catalogs;
drop policy if exists "Users can insert own route catalogs" on pathly.route_catalogs;
drop policy if exists "Users can delete own route catalogs" on pathly.route_catalogs;

-- Drop RLS Policies for pathly.route_mountain_groups
drop policy if exists "Users can select own route mountain groups" on pathly.route_mountain_groups;
drop policy if exists "Users can insert own route mountain groups" on pathly.route_mountain_groups;
drop policy if exists "Users can delete own route mountain groups" on pathly.route_mountain_groups;

-- Drop RLS Policies for pathly.analytics_events
drop policy if exists "Users can insert own analytics events" on pathly.analytics_events;
drop policy if exists "Users can select own analytics events" on pathly.analytics_events;

-- Note: RLS is still enabled on all tables, but with no policies defined,
-- access will be restricted by default. To allow access, you would need to
-- either disable RLS entirely or create new policies as needed.
