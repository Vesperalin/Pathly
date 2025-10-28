-- Migration: Fix Schema Permissions and Disable RLS
-- Purpose: Grant necessary permissions and disable RLS for development
-- Affected: pathly schema and all tables
-- Special considerations: For development only. Re-enable RLS with proper policies in production.

-- Grant usage on the pathly schema to anon and authenticated roles
grant usage on schema pathly to anon, authenticated;

-- Grant all privileges on all tables in pathly schema
grant all on all tables in schema pathly to anon, authenticated;

-- Grant all privileges on all sequences in pathly schema
grant all on all sequences in schema pathly to anon, authenticated;

-- Grant execute on all functions in pathly schema
grant execute on all functions in schema pathly to anon, authenticated;

-- Set default privileges for future objects
alter default privileges in schema pathly grant all on tables to anon, authenticated;
alter default privileges in schema pathly grant all on sequences to anon, authenticated;
alter default privileges in schema pathly grant execute on functions to anon, authenticated;

-- Disable RLS on all tables for development
alter table pathly.profiles disable row level security;
alter table pathly.mountain_groups disable row level security;
alter table pathly.catalogs disable row level security;
alter table pathly.routes disable row level security;
alter table pathly.route_catalogs disable row level security;
alter table pathly.route_mountain_groups disable row level security;
alter table pathly.analytics_events disable row level security;

