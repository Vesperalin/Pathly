-- Migration: Create get_catalog_details function
-- This function retrieves detailed catalog information including total points and paginated routes

CREATE OR REPLACE FUNCTION pathly.get_catalog_details(
  p_catalog_id uuid,
  p_user_id uuid,
  p_routes_page integer DEFAULT 1,
  p_routes_page_size integer DEFAULT 10,
  p_routes_sort_by text DEFAULT 'route_date',
  p_routes_order text DEFAULT 'desc'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pathly, public
AS $$
DECLARE
  v_catalog json;
  v_routes json;
  v_total_routes bigint;
  v_total_points integer;
  v_offset integer;
  v_sort_column text;
  v_order_direction text;
BEGIN
  -- Check if catalog exists and belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM pathly.catalogs 
    WHERE id = p_catalog_id AND user_id = p_user_id
  ) THEN
    RETURN NULL;
  END IF;

  -- Get basic catalog information
  SELECT json_build_object(
    'id', c.id,
    'name', c.name,
    'is_predefined', c.is_predefined,
    'created_at', c.created_at,
    'updated_at', c.updated_at
  )
  INTO v_catalog
  FROM pathly.catalogs c
  WHERE c.id = p_catalog_id AND c.user_id = p_user_id;

  -- Calculate total GOT points for the catalog
  SELECT COALESCE(SUM(r.got_points), 0)::integer
  INTO v_total_points
  FROM pathly.route_catalogs rc
  LEFT JOIN pathly.routes r ON rc.route_id = r.id
  WHERE rc.catalog_id = p_catalog_id;

  -- Get total count of routes in the catalog
  SELECT COUNT(*)
  INTO v_total_routes
  FROM pathly.route_catalogs
  WHERE catalog_id = p_catalog_id;

  -- Calculate offset for pagination
  v_offset := (p_routes_page - 1) * p_routes_page_size;

  -- Validate and set sort column
  v_sort_column := CASE 
    WHEN p_routes_sort_by = 'name' THEN 'r.name'
    ELSE 'r.route_date'
  END;

  -- Validate and set order direction
  v_order_direction := CASE 
    WHEN LOWER(p_routes_order) = 'asc' THEN 'ASC'
    ELSE 'DESC'
  END;

  -- Get paginated routes using dynamic SQL for sorting
  EXECUTE format(
    'SELECT COALESCE(json_agg(route_data), ''[]''::json)
     FROM (
       SELECT json_build_object(
         ''id'', r.id,
         ''name'', r.name,
         ''route_date'', r.route_date,
         ''got_points'', r.got_points
       ) AS route_data
       FROM pathly.route_catalogs rc
       INNER JOIN pathly.routes r ON rc.route_id = r.id
       WHERE rc.catalog_id = $1
       ORDER BY %s %s
       LIMIT $2 OFFSET $3
     ) routes',
    v_sort_column,
    v_order_direction
  )
  INTO v_routes
  USING p_catalog_id, p_routes_page_size, v_offset;

  -- Combine all data into final JSON response
  RETURN json_build_object(
    'id', (v_catalog->>'id')::uuid,
    'name', v_catalog->>'name',
    'is_predefined', (v_catalog->>'is_predefined')::boolean,
    'total_points', v_total_points,
    'created_at', v_catalog->>'created_at',
    'updated_at', v_catalog->>'updated_at',
    'routes', json_build_object(
      'data', v_routes,
      'pagination', json_build_object(
        'page', p_routes_page,
        'page_size', p_routes_page_size,
        'total', v_total_routes
      )
    )
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION pathly.get_catalog_details(uuid, uuid, integer, integer, text, text) TO authenticated;

-- Grant execute permission to anon users (for development)
GRANT EXECUTE ON FUNCTION pathly.get_catalog_details(uuid, uuid, integer, integer, text, text) TO anon;


