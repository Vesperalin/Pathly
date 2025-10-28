import type { Database } from "@/db/database.types";
import type { CatalogDetailsDto, CatalogPreviewDto, PaginatedCatalogsDto } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GetCatalogDetailsQuery, GetCatalogsQuery } from "./validation";

/**
 * Service layer for catalog-related operations.
 * Handles business logic and database interactions for catalogs.
 */

interface GetUserCatalogsResult {
  id: string;
  name: string;
  is_predefined: boolean;
  total_points: number;
  created_at: string;
  updated_at: string;
  total_count: number;
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
  const { data, error } = await supabase.schema("pathly").rpc("get_user_catalogs", {
    p_user_id: userId,
    p_type: params.type ?? null,
    p_sort_by: params.sort_by,
    p_order: params.order,
    p_page: params.page,
    p_page_size: params.page_size,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("RPC Error Details:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
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
  const totalCount = (data[0] as GetUserCatalogsResult).total_count;

  // Map database results to DTOs
  const catalogs: CatalogPreviewDto[] = data.map((item) => {
    const catalog = item as GetUserCatalogsResult;
    return {
      id: catalog.id,
      name: catalog.name,
      is_predefined: catalog.is_predefined,
      total_points: catalog.total_points,
      created_at: catalog.created_at,
      updated_at: catalog.updated_at,
    };
  });

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
  const { data, error } = await supabase.schema("pathly").rpc("get_catalog_details", {
    p_catalog_id: catalogId,
    p_user_id: userId,
    p_routes_page: params.routes_page,
    p_routes_page_size: params.routes_page_size,
    p_routes_sort_by: params.routes_sort_by,
    p_routes_order: params.routes_order,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("RPC Error Details:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(`Failed to fetch catalog details: ${error.message}`);
  }

  // Return null if catalog doesn't exist or user doesn't have access
  if (!data) {
    return null;
  }

  // The RPC function returns JSON, so we need to cast it to the proper type
  // We use 'unknown' as an intermediate step for safe type assertion
  return data as unknown as CatalogDetailsDto;
}
