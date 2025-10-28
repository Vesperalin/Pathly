-- Migration: Create function for creating routes with associations
-- This function handles route creation with proper transaction support
-- ensuring atomicity of all operations (route + catalogs + mountain groups)

CREATE OR REPLACE FUNCTION pathly.create_route_with_associations(
  p_user_id UUID,
  p_name VARCHAR(255),
  p_route_date DATE,
  p_distance DECIMAL(10,2),
  p_total_ascent DECIMAL(10,2),
  p_total_descent DECIMAL(10,2),
  p_duration INTEGER,
  p_got_points DECIMAL(5,1) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_catalog_ids UUID[] DEFAULT ARRAY[]::UUID[],
  p_mountain_group_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_route_id UUID;
  v_catalog_id UUID;
  v_mountain_group_id UUID;
  v_has_predefined_catalog BOOLEAN := FALSE;
  v_result JSON;
BEGIN
  -- Step 1: Check for duplicate route name for this user
  IF EXISTS (
    SELECT 1 FROM pathly.routes 
    WHERE user_id = p_user_id AND name = p_name
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_ROUTE_NAME: A route with the name "%" already exists.', p_name;
  END IF;

  -- Step 2: Validate catalog ownership and existence (if provided)
  IF array_length(p_catalog_ids, 1) > 0 THEN
    -- Check if all catalogs exist and belong to the user
    IF (SELECT COUNT(*) FROM pathly.catalogs 
        WHERE id = ANY(p_catalog_ids) AND user_id = p_user_id) 
       != array_length(p_catalog_ids, 1) 
    THEN
      RAISE EXCEPTION 'INVALID_CATALOG_IDS: One or more catalog IDs are invalid or do not belong to you.';
    END IF;

    -- Check if any catalog is predefined
    SELECT EXISTS(
      SELECT 1 FROM pathly.catalogs 
      WHERE id = ANY(p_catalog_ids) AND is_predefined = TRUE
    ) INTO v_has_predefined_catalog;

    -- If a predefined catalog is used, got_points must be provided
    IF v_has_predefined_catalog AND p_got_points IS NULL THEN
      RAISE EXCEPTION 'GOT_POINTS_REQUIRED: GOT points are required when adding a route to a predefined catalog.';
    END IF;
  END IF;

  -- Step 3: Validate mountain group existence (if provided)
  IF array_length(p_mountain_group_ids, 1) > 0 THEN
    IF (SELECT COUNT(*) FROM pathly.mountain_groups 
        WHERE id = ANY(p_mountain_group_ids)) 
       != array_length(p_mountain_group_ids, 1) 
    THEN
      RAISE EXCEPTION 'INVALID_MOUNTAIN_GROUP_IDS: One or more mountain group IDs are invalid.';
    END IF;
  END IF;

  -- Step 4: Insert the main route record
  INSERT INTO pathly.routes (
    user_id,
    name,
    route_date,
    distance,
    total_ascent,
    total_descent,
    duration,
    got_points,
    notes
  ) VALUES (
    p_user_id,
    p_name,
    p_route_date,
    p_distance,
    p_total_ascent,
    p_total_descent,
    p_duration,
    p_got_points,
    p_notes
  )
  RETURNING id INTO v_route_id;

  -- Step 5: Insert route-catalog associations
  IF array_length(p_catalog_ids, 1) > 0 THEN
    FOREACH v_catalog_id IN ARRAY p_catalog_ids LOOP
      INSERT INTO pathly.route_catalogs (route_id, catalog_id)
      VALUES (v_route_id, v_catalog_id);
    END LOOP;
  END IF;

  -- Step 6: Insert route-mountain group associations
  IF array_length(p_mountain_group_ids, 1) > 0 THEN
    FOREACH v_mountain_group_id IN ARRAY p_mountain_group_ids LOOP
      INSERT INTO pathly.route_mountain_groups (route_id, mountain_group_id)
      VALUES (v_route_id, v_mountain_group_id);
    END LOOP;
  END IF;

  -- Step 7: Return the complete route details with associations
  SELECT json_build_object(
    'id', r.id,
    'name', r.name,
    'route_date', r.route_date,
    'got_points', r.got_points,
    'distance', r.distance,
    'total_ascent', r.total_ascent,
    'total_descent', r.total_descent,
    'duration', r.duration,
    'notes', r.notes,
    'created_at', r.created_at,
    'updated_at', r.updated_at,
    'mountain_groups', COALESCE(
      (SELECT json_agg(json_build_object('id', mg.id, 'name', mg.name))
       FROM pathly.route_mountain_groups rmg
       JOIN pathly.mountain_groups mg ON rmg.mountain_group_id = mg.id
       WHERE rmg.route_id = r.id),
      '[]'::json
    ),
    'catalogs', COALESCE(
      (SELECT json_agg(json_build_object('id', c.id, 'name', c.name))
       FROM pathly.route_catalogs rc
       JOIN pathly.catalogs c ON rc.catalog_id = c.id
       WHERE rc.route_id = r.id),
      '[]'::json
    )
  )
  INTO v_result
  FROM pathly.routes r
  WHERE r.id = v_route_id;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise the exception with the original message
    -- PostgreSQL will automatically rollback the transaction
    RAISE;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION pathly.create_route_with_associations IS 
'Creates a new route with associated catalogs and mountain groups in a single transaction. 
Validates catalog ownership, mountain group existence, and conditional got_points requirement.';

