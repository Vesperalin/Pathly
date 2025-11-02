import type { Database } from "@/db/database.types";
import type { CatalogDetailsRpcResult, GetUserCatalogsResult } from "@/db/types";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import type {
  CatalogDetailsDto,
  CatalogPreviewDto,
  CreateCatalogCommand,
  PaginatedCatalogsDto,
  UpdateCatalogCommand,
} from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GetCatalogDetailsQuery, GetCatalogsQuery } from "./validation";

/**
 * Service layer for catalog-related operations.
 * Handles business logic and database interactions for catalogs.
 */

/**
 * Creates a new catalog for a specific user.
 *
 * @param supabase - Supabase client instance
 * @param command - The catalog creation command containing the name
 * @param userId - The authenticated user's ID
 * @returns The created catalog preview DTO
 * @throws ValidationError if the name is invalid
 * @throws ConflictError if a catalog with the same name already exists
 * @throws Error for other database errors
 */
export async function createCatalog(
  supabase: SupabaseClient<Database>,
  command: CreateCatalogCommand,
  userId: string
): Promise<CatalogPreviewDto> {
  // Guard: Validate inputs (but assume validated upstream)
  if (!command.name || command.name.length > 255) {
    throw new ValidationError("Invalid catalog name");
  }

  const { data: newCatalog, error: dbError } = await supabase
    .schema("pathly")
    .from("catalogs")
    .insert({ name: command.name, user_id: userId, is_predefined: false })
    .select("id, name, is_predefined, created_at, updated_at")
    .single();

  if (dbError) {
    if (dbError.code === "23505") {
      // Unique violation
      throw new ConflictError(`Catalog "${command.name}" already exists`);
    }
    if (process.env.NODE_ENV === "development") {
      console.error("DB error creating catalog:", dbError);
    }
    throw new Error("Failed to create catalog");
  }

  if (!newCatalog) {
    throw new NotFoundError("Catalog creation failed: No data returned");
  }

  return {
    id: newCatalog.id,
    name: newCatalog.name,
    is_predefined: newCatalog.is_predefined,
    total_points: 0,
    created_at: newCatalog.created_at,
    updated_at: newCatalog.updated_at,
  };
}

/**
 * Updates an existing catalog's name.
 *
 * @param supabase - Supabase client instance
 * @param catalogId - The unique identifier of the catalog to update
 * @param command - The catalog update command containing the new name
 * @param userId - The authenticated user's ID
 * @returns The updated catalog preview DTO
 * @throws NotFoundError if the catalog doesn't exist
 * @throws ForbiddenError if the user doesn't own the catalog or it's predefined
 * @throws ConflictError if a catalog with the same name already exists
 * @throws Error for other database errors
 */
export async function updateCatalog(
  supabase: SupabaseClient<Database>,
  catalogId: string,
  command: UpdateCatalogCommand,
  userId: string
): Promise<CatalogPreviewDto> {
  // Guard: Validate inputs (but assume validated upstream)
  if (!command.name || command.name.length > 255) {
    throw new ValidationError("Invalid catalog name");
  }

  // Fetch catalog to check ownership and predefined status
  const { data: catalog, error: fetchError } = await supabase
    .schema("pathly")
    .from("catalogs")
    .select("id, user_id, is_predefined, name, created_at, updated_at")
    .eq("id", catalogId)
    .single();

  if (fetchError || !catalog) {
    throw new NotFoundError("Catalog not found");
  }

  // Check ownership and predefined status
  if (catalog.user_id !== userId || catalog.is_predefined) {
    throw new ForbiddenError("Cannot update this catalog");
  }

  // Update the catalog
  const { data: updatedCatalog, error: updateError } = await supabase
    .schema("pathly")
    .from("catalogs")
    .update({ name: command.name })
    .eq("id", catalogId)
    .select("id, name, is_predefined, created_at, updated_at")
    .single();

  if (updateError) {
    if (updateError.code === "23505") {
      // Unique violation
      throw new ConflictError(`Catalog "${command.name}" already exists`);
    }
    if (process.env.NODE_ENV === "development") {
      console.error("DB error updating catalog:", updateError);
    }
    throw new Error("Failed to update catalog");
  }

  if (!updatedCatalog) {
    throw new NotFoundError("Catalog update failed: No data returned");
  }

  return {
    id: updatedCatalog.id,
    name: updatedCatalog.name,
    is_predefined: updatedCatalog.is_predefined,
    total_points: 0, // We don't recalculate here for simplicity
    created_at: updatedCatalog.created_at,
    updated_at: updatedCatalog.updated_at,
  };
}

/**
 * Deletes a catalog if the user owns it and it's not predefined.
 *
 * @param supabase - Supabase client instance
 * @param catalogId - The unique identifier of the catalog to delete
 * @param userId - The authenticated user's ID
 * @throws NotFoundError if the catalog doesn't exist
 * @throws ForbiddenError if the user doesn't own the catalog or it's predefined
 * @throws Error for other database errors
 */
export async function deleteCatalog(
  supabase: SupabaseClient<Database>,
  catalogId: string,
  userId: string
): Promise<void> {
  // Fetch catalog to check ownership and predefined status
  const { data: catalog, error: fetchError } = await supabase
    .schema("pathly")
    .from("catalogs")
    .select("id, user_id, is_predefined")
    .eq("id", catalogId)
    .single();

  if (fetchError || !catalog) {
    throw new NotFoundError("Catalog not found");
  }

  // Check ownership and predefined status
  if (catalog.user_id !== userId || catalog.is_predefined) {
    throw new ForbiddenError("Cannot delete this catalog");
  }

  // Delete the catalog
  const { error: deleteError } = await supabase.schema("pathly").from("catalogs").delete().eq("id", catalogId);

  if (deleteError) {
    if (process.env.NODE_ENV === "development") {
      console.error("DB error deleting catalog:", deleteError);
    }
    throw new Error("Failed to delete catalog");
  }
}

/**
 * Retrieves a paginated list of catalogs for a specific user.
 * Calculates total GOT points for each catalog by summing points from associated routes.
 *
 * @param supabase - Supabase client instance
 * @param userId - The authenticated user's ID
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Paginated catalog data with metadata
 * @throws Error if the database operation fails
 */
export async function getCatalogs(
  supabase: SupabaseClient<Database>,
  userId: string,
  params: GetCatalogsQuery
): Promise<PaginatedCatalogsDto> {
  // Call the PostgreSQL function via RPC in the pathly schema
  const { data, error } = (await supabase.schema("pathly").rpc("get_user_catalogs", {
    p_user_id: userId,
    p_type: params.type || undefined,
    p_sort_by: params.sort_by,
    p_order: params.order,
    p_page: params.page,
    p_page_size: params.page_size,
  })) as {
    data: GetUserCatalogsResult[] | null;
    error: { message: string; details?: string; hint?: string; code?: string } | null;
  };

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("RPC Error Details:", error);
    }
    throw new Error(`Failed to fetch catalogs: ${error.message}`);
  }

  // Handle empty results
  if (!data || data.length === 0) {
    return {
      data: [],
      pagination: {
        page: params.page,
        page_size: params.page_size,
        total: 0,
      },
    };
  }

  // Extract total count from first row (all rows have the same total_count)
  const totalCount = data[0].total_count;

  // Map database results to DTOs
  const catalogs: CatalogPreviewDto[] = data.map((catalog) => ({
    id: catalog.id,
    name: catalog.name,
    is_predefined: catalog.is_predefined,
    total_points: catalog.total_points,
    created_at: catalog.created_at,
    updated_at: catalog.updated_at,
  }));

  // Construct paginated response
  return {
    data: catalogs,
    pagination: {
      page: params.page,
      page_size: params.page_size,
      total: Number(totalCount),
    },
  };
}

/**
 * Retrieves detailed information about a single catalog.
 * Includes catalog metadata, total GOT points, and a paginated list of associated routes.
 *
 * @param supabase - Supabase client instance
 * @param catalogId - The unique identifier of the catalog
 * @param userId - The authenticated user's ID
 * @param params - Query parameters for routes pagination and sorting
 * @returns Catalog details with nested paginated routes
 * @throws Error if the database operation fails or catalog doesn't exist
 */
export async function getCatalogDetails(
  supabase: SupabaseClient<Database>,
  catalogId: string,
  userId: string,
  params: GetCatalogDetailsQuery
): Promise<CatalogDetailsDto | null> {
  // Call the PostgreSQL function via RPC
  const { data, error } = (await supabase.schema("pathly").rpc("get_catalog_details", {
    p_catalog_id: catalogId,
    p_user_id: userId,
    p_routes_page: params.routes_page,
    p_routes_page_size: params.routes_page_size,
    p_routes_sort_by: params.routes_sort_by,
    p_routes_order: params.routes_order,
  })) as {
    data: CatalogDetailsRpcResult | null;
    error: { message: string; details?: string; hint?: string; code?: string } | null;
  };

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("RPC Error Details:", error);
    }
    throw new Error(`Failed to fetch catalog details: ${error.message}`);
  }

  // Return null if catalog doesn't exist or user doesn't have access
  if (!data) {
    return null;
  }

  // Transform RPC result to DTO
  return {
    id: data.id,
    name: data.name,
    is_predefined: data.is_predefined,
    total_points: data.total_points,
    created_at: data.created_at,
    updated_at: data.updated_at,
    routes: data.routes,
  };
}
