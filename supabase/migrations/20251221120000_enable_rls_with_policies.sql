-- Migration: Enable RLS with Comprehensive Policies
-- Purpose: Re-enable Row Level Security on all tables and recreate security policies
-- Affected: All tables in pathly schema
-- Special considerations: This migration restores production-ready security policies

-- Enable RLS on all tables
alter table pathly.profiles enable row level security;
alter table pathly.mountain_groups enable row level security;
alter table pathly.catalogs enable row level security;
alter table pathly.routes enable row level security;
alter table pathly.route_catalogs enable row level security;
alter table pathly.route_mountain_groups enable row level security;
alter table pathly.analytics_events enable row level security;

-- ============================================================================
-- RLS Policies for pathly.profiles
-- ============================================================================

-- Policy: Users can select their own profile
create policy "Users can select own profile" on pathly.profiles
  for select using (auth.uid() = id);

-- Policy: Users can update their own profile
create policy "Users can update own profile" on pathly.profiles
  for update using (auth.uid() = id);

-- Policy: Users can insert their own profile (for profile creation)
create policy "Users can insert own profile" on pathly.profiles
  for insert with check (auth.uid() = id);

-- ============================================================================
-- RLS Policies for pathly.mountain_groups
-- ============================================================================

-- Policy: Anonymous users can select mountain groups (public data)
create policy "Anonymous users can select mountain groups" on pathly.mountain_groups
  for select to anon using (true);

-- Policy: Authenticated users can select mountain groups
create policy "Authenticated users can select mountain groups" on pathly.mountain_groups
  for select to authenticated using (true);

-- ============================================================================
-- RLS Policies for pathly.catalogs
-- ============================================================================

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

-- ============================================================================
-- RLS Policies for pathly.routes
-- ============================================================================

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

-- ============================================================================
-- RLS Policies for pathly.route_catalogs
-- ============================================================================

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

-- ============================================================================
-- RLS Policies for pathly.route_mountain_groups
-- ============================================================================

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

-- ============================================================================
-- RLS Policies for pathly.analytics_events
-- ============================================================================

-- Policy: Users can insert their own analytics events
create policy "Users can insert own analytics events" on pathly.analytics_events
  for insert with check (auth.uid() = user_id);

-- Policy: Users can select their own analytics events (restricted access for privacy)
create policy "Users can select own analytics events" on pathly.analytics_events
  for select using (auth.uid() = user_id);

-- ============================================================================
-- Additional Security: Revoke broad permissions granted earlier
-- ============================================================================

-- Remove "all privileges" grants that were too permissive
revoke all on all tables in schema pathly from anon, authenticated;
revoke all on all sequences in schema pathly from anon, authenticated;
revoke execute on all functions in schema pathly from anon, authenticated;

-- Remove default privileges that were too permissive
alter default privileges in schema pathly revoke all on tables from anon, authenticated;
alter default privileges in schema pathly revoke all on sequences from anon, authenticated;
alter default privileges in schema pathly revoke execute on functions from anon, authenticated;

-- Grant minimal necessary permissions
grant usage on schema pathly to anon, authenticated;

-- Grant specific permissions on sequences (needed for insert operations)
grant usage, select on all sequences in schema pathly to authenticated;
alter default privileges in schema pathly grant usage, select on sequences to authenticated;

-- ============================================================================
-- Grant table permissions - RLS will restrict access to own data only
-- ============================================================================

-- profiles: authenticated users need SELECT, INSERT, UPDATE
grant select, insert, update on pathly.profiles to authenticated;

-- mountain_groups: public read access (for both anon and authenticated)
grant select on pathly.mountain_groups to anon, authenticated;

-- catalogs: authenticated users need full CRUD
grant select, insert, update, delete on pathly.catalogs to authenticated;

-- routes: authenticated users need full CRUD
grant select, insert, update, delete on pathly.routes to authenticated;

-- route_catalogs: authenticated users need to manage associations
grant select, insert, delete on pathly.route_catalogs to authenticated;

-- route_mountain_groups: authenticated users need to manage associations
grant select, insert, delete on pathly.route_mountain_groups to authenticated;

-- analytics_events: authenticated users need INSERT and SELECT
grant select, insert on pathly.analytics_events to authenticated;

-- ============================================================================
-- Grant function permissions
-- ============================================================================

-- Grant execute on specific functions (stored procedures for route operations)
grant execute on function pathly.update_updated_at_column() to authenticated;
grant execute on function pathly.handle_new_user() to authenticated;

-- Grant execute on catalog functions with correct signatures
grant execute on function pathly.get_user_catalogs(uuid, text, text, text, integer, integer) to authenticated;
grant execute on function pathly.get_catalog_details(uuid, uuid, integer, integer, text, text) to authenticated;

-- Grant execute on route functions with correct signatures
grant execute on function pathly.create_route_with_associations(
  uuid, varchar, date, numeric, numeric, numeric, integer, numeric, text, uuid[], uuid[]
) to authenticated;
grant execute on function pathly.update_route_with_associations(
  uuid, uuid, varchar, date, numeric, text, uuid[], uuid[], boolean, boolean, boolean, boolean, boolean, boolean
) to authenticated;

-- Note: With RLS enabled and policies in place, users will only be able to access
-- their own data, even though they have SELECT, INSERT, UPDATE, DELETE privileges
-- on the tables. The RLS policies act as additional security layer on top of grants.

