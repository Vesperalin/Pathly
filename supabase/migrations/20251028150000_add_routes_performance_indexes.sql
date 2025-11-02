-- Migration: Add Performance Indexes for Routes Table
-- Purpose: Optimize query performance for GET /api/routes endpoint
-- Affected: pathly.routes table
-- Special considerations: These indexes support sorting by route_date and filtering by user_id

-- Index for default sorting (by route_date DESC) and user filtering
-- This index will be used when fetching routes sorted by date (default behavior)
create index if not exists idx_routes_user_route_date 
on pathly.routes (user_id, route_date desc);

-- Note: The existing idx_routes_user_name (user_id, name) unique index
-- already covers the search and sort by name use case, so no additional index is needed.

