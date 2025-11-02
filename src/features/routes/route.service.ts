import type { Database } from "@/db/database.types";
import type { CreateRouteWithAssociationsResult } from "@/db/types";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import type { CreateRouteCommand, RouteDetailsDto, UpdateRouteCommand } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Service layer for route-related operations.
 * Handles business logic and database interactions for routes.
 */

/**
 * Type definitions for nested Supabase query responses
 */
interface RouteMountainGroupItem {
  mountain_groups: {
    id: string;
    name: string;
  } | null;
}

interface RouteCatalogItem {
  catalogs: {
    id: string;
    name: string;
  } | null;
}

/**
 * Creates a new route with associated mountain groups and catalogs.
 * Uses a PostgreSQL function to ensure proper transaction handling and data consistency.
 * All operations (validation + inserts) are performed atomically in the database.
 *
 * @param supabase - Supabase client instance
 * @param command - Validated route creation data
 * @param userId - The authenticated user's ID
 * @returns The newly created route with all associations
 * @throws Error if validation fails or database operation fails
 */
export async function createRoute(
  supabase: SupabaseClient<Database>,
  command: CreateRouteCommand,
  userId: string
): Promise<RouteDetailsDto> {
  // Call the PostgreSQL function that handles everything in a transaction
  const { data, error } = (await supabase.schema("pathly").rpc("create_route_with_associations", {
    p_user_id: userId,
    p_name: command.name,
    p_route_date: command.route_date,
    p_distance: command.distance,
    p_total_ascent: command.total_ascent,
    p_total_descent: command.total_descent,
    p_duration: command.duration,
    p_got_points: command.got_points ?? undefined,
    p_notes: command.notes ?? undefined,
    p_catalog_ids: command.catalog_ids ?? undefined,
    p_mountain_group_ids: command.mountain_group_ids ?? undefined,
  })) as {
    data: CreateRouteWithAssociationsResult | null;
    error: { message: string; details?: string; hint?: string; code?: string } | null;
  };

  if (error) {
    // Handle specific error types based on the error message
    const errorMessage = error.message;

    // Parse custom error messages from the PostgreSQL function
    if (errorMessage.includes("DUPLICATE_ROUTE_NAME:")) {
      const message = errorMessage.replace("DUPLICATE_ROUTE_NAME:", "").trim();
      throw new Error(message);
    }

    if (errorMessage.includes("INVALID_CATALOG_IDS:")) {
      const message = errorMessage.replace("INVALID_CATALOG_IDS:", "").trim();
      throw new Error(message);
    }

    if (errorMessage.includes("GOT_POINTS_REQUIRED:")) {
      const message = errorMessage.replace("GOT_POINTS_REQUIRED:", "").trim();
      throw new Error(message);
    }

    if (errorMessage.includes("INVALID_MOUNTAIN_GROUP_IDS:")) {
      const message = errorMessage.replace("INVALID_MOUNTAIN_GROUP_IDS:", "").trim();
      throw new Error(message);
    }

    // Log unexpected errors for debugging
    if (process.env.NODE_ENV === "development") {
      console.error("RPC Error Details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }

    throw new Error(`Failed to create route: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to create route: No data returned from database.");
  }

  // Transform RPC result to DTO
  return {
    id: data.id,
    name: data.name,
    route_date: data.route_date,
    distance: data.distance,
    total_ascent: data.total_ascent,
    total_descent: data.total_descent,
    duration: data.duration,
    got_points: data.got_points,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
    mountain_groups: data.mountain_groups,
    catalogs: data.catalogs,
  };
}

/**
 * Retrieves detailed information about a single route.
 * Includes route metadata and associated mountain groups and catalogs.
 * Uses a single optimized query with nested selects to minimize database round trips.
 *
 * @param supabase - Supabase client instance
 * @param routeId - The unique identifier of the route
 * @param userId - The authenticated user's ID
 * @returns Route details with associations or null if not found
 * @throws Error if the database operation fails
 */
export async function getRouteDetails(
  supabase: SupabaseClient<Database>,
  routeId: string,
  userId: string
): Promise<RouteDetailsDto | null> {
  // Single optimized query with nested selects for related data
  const { data: route, error: routeError } = await supabase
    .schema("pathly")
    .from("routes")
    .select(
      `
      id,
      name,
      route_date,
      got_points,
      distance,
      total_ascent,
      total_descent,
      duration,
      notes,
      created_at,
      updated_at,
      route_mountain_groups (
        mountain_groups (
          id,
          name
        )
      ),
      route_catalogs (
        catalogs (
          id,
          name
        )
      )
    `
    )
    .eq("id", routeId)
    .eq("user_id", userId)
    .single();

  if (routeError) {
    if (routeError.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to fetch route: ${routeError.message}`);
  }

  // Transform the nested data to match RouteDetailsDto structure
  const mountainGroups =
    (route.route_mountain_groups as unknown as RouteMountainGroupItem[] | null)
      ?.map((item) => item.mountain_groups)
      .filter((mg): mg is { id: string; name: string } => mg !== null) ?? [];

  const catalogs =
    (route.route_catalogs as unknown as RouteCatalogItem[] | null)
      ?.map((item) => item.catalogs)
      .filter((cat): cat is { id: string; name: string } => cat !== null) ?? [];

  // Construct the DTO without user_id and without the junction table data
  const routeDetails: RouteDetailsDto = {
    id: route.id,
    name: route.name,
    route_date: route.route_date,
    got_points: route.got_points,
    distance: route.distance,
    total_ascent: route.total_ascent,
    total_descent: route.total_descent,
    duration: route.duration,
    notes: route.notes,
    created_at: route.created_at,
    updated_at: route.updated_at,
    mountain_groups: mountainGroups,
    catalogs: catalogs,
  };

  return routeDetails;
}

/**
 * Updates an existing route with new data.
 * Handles partial updates and manages associations with mountain groups and catalogs.
 * Uses a PostgreSQL function to ensure proper transaction handling and data consistency.
 * All operations (validation + updates) are performed atomically in the database.
 *
 * @param supabase - Supabase client instance
 * @param routeId - The unique identifier of the route to update
 * @param command - Validated route update data (partial)
 * @param userId - The authenticated user's ID
 * @returns The updated route with all associations
 * @throws Error if validation fails, route not found, unauthorized, or database operation fails
 */
export async function updateRoute(
  supabase: SupabaseClient<Database>,
  routeId: string,
  command: UpdateRouteCommand,
  userId: string
): Promise<RouteDetailsDto> {
  // Call the PostgreSQL function that handles everything in a transaction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase.schema("pathly") as any).rpc("update_route_with_associations", {
    p_route_id: routeId,
    p_user_id: userId,
    p_name: command.name ?? null,
    p_route_date: command.route_date ?? null,
    p_got_points: command.got_points ?? null,
    p_notes: command.notes ?? null,
    p_catalog_ids: command.catalog_ids ?? null,
    p_mountain_group_ids: command.mountain_group_ids ?? null,
    // Boolean flags to distinguish between NULL and not provided
    p_update_name: command.name !== undefined,
    p_update_route_date: command.route_date !== undefined,
    p_update_got_points: command.got_points !== undefined,
    p_update_notes: command.notes !== undefined,
    p_update_catalog_ids: command.catalog_ids !== undefined,
    p_update_mountain_group_ids: command.mountain_group_ids !== undefined,
  })) as {
    data: CreateRouteWithAssociationsResult | null;
    error: { message: string; details?: string; hint?: string; code?: string } | null;
  };

  if (error) {
    // Handle specific error types based on the error message
    const errorMessage = error.message;

    // Parse custom error messages from the PostgreSQL function
    if (errorMessage.includes("ROUTE_NOT_FOUND:")) {
      throw new NotFoundError(errorMessage.replace("ROUTE_NOT_FOUND:", "").trim());
    }

    if (errorMessage.includes("FORBIDDEN:")) {
      throw new ForbiddenError(errorMessage.replace("FORBIDDEN:", "").trim());
    }

    if (errorMessage.includes("DUPLICATE_ROUTE_NAME:")) {
      throw new ConflictError(errorMessage.replace("DUPLICATE_ROUTE_NAME:", "").trim());
    }

    if (errorMessage.includes("INVALID_CATALOG_IDS:")) {
      throw new NotFoundError(errorMessage.replace("INVALID_CATALOG_IDS:", "").trim());
    }

    if (errorMessage.includes("GOT_POINTS_REQUIRED:")) {
      throw new ValidationError(errorMessage.replace("GOT_POINTS_REQUIRED:", "").trim());
    }

    if (errorMessage.includes("INVALID_MOUNTAIN_GROUP_IDS:")) {
      throw new NotFoundError(errorMessage.replace("INVALID_MOUNTAIN_GROUP_IDS:", "").trim());
    }

    // Log unexpected errors for debugging
    if (process.env.NODE_ENV === "development") {
      console.error("RPC Error Details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }

    throw new Error(`Failed to update route: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to update route: No data returned from database.");
  }

  // Transform RPC result to DTO
  return {
    id: data.id,
    name: data.name,
    route_date: data.route_date,
    distance: data.distance,
    total_ascent: data.total_ascent,
    total_descent: data.total_descent,
    duration: data.duration,
    got_points: data.got_points,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
    mountain_groups: data.mountain_groups,
    catalogs: data.catalogs,
  };
}
