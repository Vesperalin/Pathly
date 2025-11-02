-- Migration: Create function for updating routes with associations
-- This function handles route updates with proper transaction support
-- ensuring atomicity of all operations (route update + catalog/mountain group replacements)

CREATE OR REPLACE FUNCTION pathly.update_route_with_associations(
  p_route_id UUID,
  p_user_id UUID,
  p_name VARCHAR(255) DEFAULT NULL,
  p_route_date DATE DEFAULT NULL,
  p_got_points DECIMAL(5,1) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_catalog_ids UUID[] DEFAULT NULL,
  p_mountain_group_ids UUID[] DEFAULT NULL,
  -- Flags to distinguish between NULL value and not provided
  p_update_name BOOLEAN DEFAULT FALSE,
  p_update_route_date BOOLEAN DEFAULT FALSE,
  p_update_got_points BOOLEAN DEFAULT FALSE,
  p_update_notes BOOLEAN DEFAULT FALSE,
  p_update_catalog_ids BOOLEAN DEFAULT FALSE,
  p_update_mountain_group_ids BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_user_id UUID;
  v_existing_name VARCHAR(255);
  v_existing_got_points DECIMAL(5,1);
  v_catalog_id UUID;
  v_mountain_group_id UUID;
  v_has_predefined_catalog BOOLEAN := FALSE;
  v_final_got_points DECIMAL(5,1);
  v_result JSON;
BEGIN
  -- Step 1: Verify route exists and get current values
  SELECT user_id, name, got_points
  INTO v_existing_user_id, v_existing_name, v_existing_got_points
  FROM pathly.routes
  WHERE id = p_route_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ROUTE_NOT_FOUND: Route not found.';
  END IF;

  -- Step 2: Verify ownership
  IF v_existing_user_id != p_user_id THEN
    RAISE EXCEPTION 'FORBIDDEN: You do not have permission to update this route.';
  END IF;

  -- Step 3: Check for duplicate name if name is being updated
  IF p_update_name AND p_name IS NOT NULL AND p_name != v_existing_name THEN
    IF EXISTS (
      SELECT 1 FROM pathly.routes 
      WHERE user_id = p_user_id 
        AND name = p_name 
        AND id != p_route_id
    ) THEN
      RAISE EXCEPTION 'DUPLICATE_ROUTE_NAME: A route with the name "%" already exists.', p_name;
    END IF;
  END IF;

  -- Determine final got_points value for validation
  IF p_update_got_points THEN
    v_final_got_points := p_got_points;
  ELSE
    v_final_got_points := v_existing_got_points;
  END IF;

  -- Step 4: Validate catalog_ids if provided
  IF p_update_catalog_ids AND p_catalog_ids IS NOT NULL THEN
    IF array_length(p_catalog_ids, 1) > 0 THEN
      -- Check if all catalogs exist and belong to the user (or are predefined)
      IF (SELECT COUNT(*) FROM pathly.catalogs 
          WHERE id = ANY(p_catalog_ids) 
            AND (user_id = p_user_id OR is_predefined = TRUE)) 
         != array_length(p_catalog_ids, 1) 
      THEN
        RAISE EXCEPTION 'INVALID_CATALOG_IDS: One or more catalog IDs are invalid or you do not have access to them.';
      END IF;

      -- Check if any catalog is predefined
      SELECT EXISTS(
        SELECT 1 FROM pathly.catalogs 
        WHERE id = ANY(p_catalog_ids) AND is_predefined = TRUE
      ) INTO v_has_predefined_catalog;

      -- If a predefined catalog is used, got_points must be provided
      IF v_has_predefined_catalog AND v_final_got_points IS NULL THEN
        RAISE EXCEPTION 'GOT_POINTS_REQUIRED: GOT points are required when adding a route to a predefined catalog.';
      END IF;
    END IF;
  END IF;

  -- Step 5: Validate mountain_group_ids if provided
  IF p_update_mountain_group_ids AND p_mountain_group_ids IS NOT NULL THEN
    IF array_length(p_mountain_group_ids, 1) > 0 THEN
      IF (SELECT COUNT(*) FROM pathly.mountain_groups 
          WHERE id = ANY(p_mountain_group_ids)) 
         != array_length(p_mountain_group_ids, 1) 
      THEN
        RAISE EXCEPTION 'INVALID_MOUNTAIN_GROUP_IDS: One or more mountain group IDs are invalid.';
      END IF;
    END IF;
  END IF;

  -- Step 6: Update the route record (only fields that are being updated)
  UPDATE pathly.routes
  SET
    name = CASE WHEN p_update_name THEN COALESCE(p_name, name) ELSE name END,
    route_date = CASE WHEN p_update_route_date THEN COALESCE(p_route_date, route_date) ELSE route_date END,
    got_points = CASE WHEN p_update_got_points THEN p_got_points ELSE got_points END,
    notes = CASE WHEN p_update_notes THEN p_notes ELSE notes END,
    updated_at = NOW()
  WHERE id = p_route_id;

  -- Step 7: Update mountain group associations if specified
  IF p_update_mountain_group_ids THEN
    -- Delete existing associations
    DELETE FROM pathly.route_mountain_groups WHERE route_id = p_route_id;
    
    -- Insert new associations
    IF p_mountain_group_ids IS NOT NULL AND array_length(p_mountain_group_ids, 1) > 0 THEN
      FOREACH v_mountain_group_id IN ARRAY p_mountain_group_ids LOOP
        INSERT INTO pathly.route_mountain_groups (route_id, mountain_group_id)
        VALUES (p_route_id, v_mountain_group_id);
      END LOOP;
    END IF;
  END IF;

  -- Step 8: Update catalog associations if specified
  IF p_update_catalog_ids THEN
    -- Delete existing associations
    DELETE FROM pathly.route_catalogs WHERE route_id = p_route_id;
    
    -- Insert new associations
    IF p_catalog_ids IS NOT NULL AND array_length(p_catalog_ids, 1) > 0 THEN
      FOREACH v_catalog_id IN ARRAY p_catalog_ids LOOP
        INSERT INTO pathly.route_catalogs (route_id, catalog_id)
        VALUES (p_route_id, v_catalog_id);
      END LOOP;
    END IF;
  END IF;

  -- Step 9: Return the complete updated route details with associations
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
  WHERE r.id = p_route_id;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise the exception with the original message
    -- PostgreSQL will automatically rollback the transaction
    RAISE;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION pathly.update_route_with_associations IS 
'Updates an existing route with optional catalog and mountain group associations in a single transaction. 
Validates ownership, catalog access, mountain group existence, name uniqueness, and conditional got_points requirement.
Uses boolean flags to distinguish between NULL values and fields that should not be updated.';

