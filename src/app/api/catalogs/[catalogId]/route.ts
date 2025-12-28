import { deleteCatalog, getCatalogDetails, updateCatalog } from "@/features/catalogs/catalog.service";
import {
  CatalogIdParamSchema,
  GetCatalogDetailsQuerySchema,
  UpdateCatalogCommandSchema,
} from "@/features/catalogs/validation";
import { handleApiError } from "@/lib/apiErrors";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/catalogs/{catalogId}
 *
 * Retrieves detailed information about a single catalog, including:
 * - Basic catalog information (id, name, is_predefined, created_at, updated_at)
 * - Total GOT points calculated from all associated routes
 * - Paginated list of routes belonging to this catalog
 *
 * Path Parameters:
 * - catalogId: UUID - The unique identifier for the catalog
 *
 * Query Parameters:
 * - routes_page: number (optional, default: 1) - Page number for routes pagination
 * - routes_page_size: number (optional, default: 10, max: 100) - Routes per page
 * - routes_sort_by: 'name' | 'route_date' (optional, default: 'route_date') - Sort field for routes
 * - routes_order: 'asc' | 'desc' (optional, default: 'desc') - Sort order for routes
 *
 * @param request - The incoming NextRequest object
 * @param context - Route context containing the catalogId parameter
 * @returns A NextResponse containing catalog details with paginated routes or an error message
 *
 * Response Status Codes:
 * - 200: Catalog retrieved successfully
 * - 400: Invalid catalogId format or query parameters
 * - 404: Catalog not found or user doesn't have permission to view it
 * - 500: Internal server error
 */
export async function GET(request: NextRequest, context: { params: Promise<{ catalogId: string }> }) {
  try {
    // Initialize Supabase client
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 1: Validate catalogId from path parameter
    const params = await context.params;
    const paramsValidation = CatalogIdParamSchema.safeParse(params);

    if (!paramsValidation.success) {
      throw new ValidationError("Invalid catalog ID", paramsValidation.error.flatten().fieldErrors);
    }

    const { catalogId } = paramsValidation.data;

    // Step 2: Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      routes_page: searchParams.get("routes_page"),
      routes_page_size: searchParams.get("routes_page_size"),
      routes_sort_by: searchParams.get("routes_sort_by"),
      routes_order: searchParams.get("routes_order"),
    };

    const queryValidation = GetCatalogDetailsQuerySchema.safeParse(queryParams);

    if (!queryValidation.success) {
      throw new ValidationError("Invalid query parameters", queryValidation.error.issues);
    }

    const validatedQuery = queryValidation.data;

    // Step 3: Fetch catalog details using the service layer
    const result = await getCatalogDetails(supabase, catalogId, user.id, validatedQuery);

    // Handle catalog not found or permission denied
    if (!result) {
      throw new NotFoundError("Catalog not found or you don't have permission to view it.");
    }

    // Step 4: Return the catalog details
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/catalogs/{catalogId}
 *
 * Updates the name of a specific user-created catalog.
 *
 * @param request - The incoming Next.js request object
 * @param context - Contains the dynamic route parameters
 * @returns JSON response with the updated catalog or an error message
 *
 * @throws 400 - Invalid request body or catalogId
 * @throws 403 - User doesn't own the catalog or catalog is predefined
 * @throws 404 - Catalog not found
 * @throws 409 - Catalog name already exists for this user
 * @throws 500 - Internal server error
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ catalogId: string }> }
): Promise<NextResponse> {
  try {
    // Step 1: Initialize Supabase client
    const supabase = await createClient();

    // Step 2: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 3: Validate URL parameters
    const params = await context.params;
    const paramsValidation = CatalogIdParamSchema.safeParse(params);

    if (!paramsValidation.success) {
      throw new ValidationError("Invalid catalog ID", paramsValidation.error.flatten().fieldErrors);
    }

    const { catalogId } = paramsValidation.data;

    // Step 4: Validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      throw new ValidationError("Invalid JSON in request body.", [
        {
          code: "invalid_json",
          message: "Invalid JSON in request body.",
          path: ["body"],
        },
      ]);
    }

    const bodyValidation = UpdateCatalogCommandSchema.safeParse(requestBody);

    if (!bodyValidation.success) {
      throw new ValidationError("Invalid request body", bodyValidation.error.flatten().fieldErrors);
    }

    const validatedData = bodyValidation.data;

    // Step 5: Update the catalog using the service layer
    const updatedCatalog = await updateCatalog(supabase, catalogId, validatedData, user.id);

    // Step 6: Return the updated catalog
    return NextResponse.json(updatedCatalog, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/catalogs/{catalogId}
 *
 * Deletes a specific user-created catalog.
 * Predefined catalogs cannot be deleted.
 * Deleting a catalog does not delete the routes associated with it.
 *
 * @param request - The incoming Next.js request object
 * @param context - Contains the dynamic route parameters
 * @returns Empty response with 204 status on success, or error message
 *
 * @throws 400 - Invalid catalogId format
 * @throws 401 - User not authenticated (will be implemented with auth)
 * @throws 403 - User doesn't own the catalog or catalog is predefined
 * @throws 404 - Catalog not found
 * @throws 500 - Internal server error
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ catalogId: string }> }
): Promise<NextResponse> {
  try {
    // Step 1: Initialize Supabase client
    const supabase = await createClient();

    // Step 2: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 3: Validate URL parameters
    const params = await context.params;
    const paramsValidation = CatalogIdParamSchema.safeParse(params);

    if (!paramsValidation.success) {
      throw new ValidationError("Invalid catalog ID", paramsValidation.error.flatten().fieldErrors);
    }

    const { catalogId } = paramsValidation.data;

    // Step 4: Delete the catalog using the service layer
    await deleteCatalog(supabase, catalogId, user.id);

    // Step 5: Return success response with 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
