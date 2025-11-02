-- Migration: Fix get_user_catalogs function varchar to text casting
-- This fixes the "structure of query does not match function result type" error

DROP FUNCTION IF EXISTS pathly.get_user_catalogs(uuid, text, text, text, integer, integer);

CREATE OR REPLACE FUNCTION pathly.get_user_catalogs(
  p_user_id uuid,
  p_type text DEFAULT NULL,
  p_sort_by text DEFAULT 'name',
  p_order text DEFAULT 'asc',
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name text,
  is_predefined boolean,
  total_points integer,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pathly, public
AS $$
DECLARE
  v_offset integer;
  v_sort_column text;
  v_order_direction text;
BEGIN
  -- Calculate offset for pagination
  v_offset := (p_page - 1) * p_page_size;
  
  -- Validate and set sort column (using cp alias from CTE)
  v_sort_column := CASE 
    WHEN p_sort_by = 'created_at' THEN 'cp.created_at'
    ELSE 'cp.name'
  END;
  
  -- Validate and set order direction
  v_order_direction := CASE 
    WHEN LOWER(p_order) = 'desc' THEN 'DESC'
    ELSE 'ASC'
  END;

  -- Return paginated catalogs with total points calculation
  RETURN QUERY EXECUTE format(
    'WITH catalog_points AS (
      SELECT 
        c.id,
        c.name::text,
        c.is_predefined,
        c.created_at,
        c.updated_at,
        COALESCE(SUM(r.got_points), 0)::integer AS total_points
      FROM pathly.catalogs c
      LEFT JOIN pathly.route_catalogs rc ON c.id = rc.catalog_id
      LEFT JOIN pathly.routes r ON rc.route_id = r.id
      WHERE c.user_id = $1
        AND ($2 IS NULL OR 
          (($2 = ''predefined'' AND c.is_predefined = true) OR 
           ($2 = ''user'' AND c.is_predefined = false)))
      GROUP BY c.id, c.name, c.is_predefined, c.created_at, c.updated_at
    ),
    total_catalog_count AS (
      SELECT COUNT(*) AS count FROM catalog_points
    )
    SELECT 
      cp.id,
      cp.name,
      cp.is_predefined,
      cp.total_points,
      cp.created_at,
      cp.updated_at,
      tcc.count AS total_count
    FROM catalog_points cp
    CROSS JOIN total_catalog_count tcc
    ORDER BY %s %s
    LIMIT $3 OFFSET $4',
    v_sort_column,
    v_order_direction
  )
  USING p_user_id, p_type, p_page_size, v_offset;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION pathly.get_user_catalogs(uuid, text, text, text, integer, integer) TO authenticated;

-- Grant execute permission to anon users (for development)
GRANT EXECUTE ON FUNCTION pathly.get_user_catalogs(uuid, text, text, text, integer, integer) TO anon;

