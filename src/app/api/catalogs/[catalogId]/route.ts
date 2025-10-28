import { getCatalogDetails } from "@/features/catalogs/catalog.service";
import { GetCatalogDetailsQuerySchema } from "@/features/catalogs/validation";
import { DEFAULT_USER_ID } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Zod schema for validating the catalogId URL parameter.
 * Ensures the catalogId is a valid UUID format.
 */
const catalogParamsSchema = z.object({
  catalogId: z.string().uuid({ message: "Invalid catalog ID." }),
});

/**
 * Zod schema for validating the request body.
 * Ensures the name is a non-empty string with a maximum length of 255 characters.
 */
const updateCatalogBodySchema = z.object({
  name: z.string().min(1, "Name is required.").max(255, "Name must not exceed 255 characters."),
});

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

    // Step 1: Validate catalogId from path parameter
    const params = await context.params;
    const paramsValidation = catalogParamsSchema.safeParse(params);

    if (!paramsValidation.success) {
      return NextResponse.json(
        {
          error: "Invalid catalog ID.",
          details: paramsValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
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
      return NextResponse.json(
        {
          error: "Invalid query parameters.",
          details: queryValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const validatedQuery = queryValidation.data;

    // Step 3: Fetch catalog details using the service layer
    const result = await getCatalogDetails(supabase, catalogId, DEFAULT_USER_ID, validatedQuery);

    // Handle catalog not found or permission denied
    if (!result) {
      return NextResponse.json(
        {
          error: "Catalog not found or you don't have permission to view it.",
        },
        { status: 404 }
      );
    }

    // Step 4: Return the catalog details
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Catch any unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/catalogs/[catalogId]:", error);
    return NextResponse.json(
      {
        error: "An unexpected server error occurred.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/catalogs/{catalogId}
 *
 * Updates the name of a specific user-created catalog.
 * Note: Currently uses DEFAULT_USER_ID. Authentication will be implemented later.
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

    // Step 2: Validate URL parameters
    const params = await context.params;
    const paramsValidation = catalogParamsSchema.safeParse(params);

    if (!paramsValidation.success) {
      return NextResponse.json(
        {
          error: "Invalid catalog ID.",
          details: paramsValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { catalogId } = paramsValidation.data;

    // Step 3: Validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }

    const bodyValidation = updateCatalogBodySchema.safeParse(requestBody);

    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          error: "Invalid request body.",
          details: bodyValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name } = bodyValidation.data;

    // Step 4: Fetch the catalog to verify existence and ownership
    const { data: catalog, error: fetchError } = await supabase
      .schema("pathly")
      .from("catalogs")
      .select("id, user_id, is_predefined, name")
      .eq("id", catalogId)
      .single();

    // Handle catalog not found
    if (fetchError || !catalog) {
      return NextResponse.json({ error: "Catalog not found." }, { status: 404 });
    }

    // Step 5: Authorization checks
    // TODO: Replace DEFAULT_USER_ID with actual authenticated user ID once auth is implemented
    // Check if user owns the catalog
    if (catalog.user_id !== DEFAULT_USER_ID) {
      return NextResponse.json(
        { error: "Forbidden. You do not have permission to update this catalog." },
        { status: 403 }
      );
    }

    // Check if catalog is predefined (system catalogs cannot be modified)
    if (catalog.is_predefined) {
      return NextResponse.json({ error: "Forbidden. Predefined catalogs cannot be updated." }, { status: 403 });
    }

    // Step 6: Update the catalog in the database
    const { data: updatedCatalog, error: updateError } = await supabase
      .schema("pathly")
      .from("catalogs")
      .update({ name })
      .eq("id", catalogId)
      .select("id, name, is_predefined, created_at, updated_at")
      .single();

    // Step 7: Handle database errors
    if (updateError) {
      // Handle unique constraint violation (duplicate name for user)
      if (updateError.code === "23505") {
        return NextResponse.json({ error: "Conflict. A catalog with this name already exists." }, { status: 409 });
      }

      // Log unexpected errors for debugging
      // eslint-disable-next-line no-console
      console.error("Database error while updating catalog:", updateError);
      return NextResponse.json({ error: "Internal server error. Please try again later." }, { status: 500 });
    }

    // Step 8: Return the updated catalog
    return NextResponse.json(updatedCatalog, { status: 200 });
  } catch (error) {
    // Catch any unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in PATCH /api/catalogs/[catalogId]:", error);
    return NextResponse.json({ error: "Internal server error. Please try again later." }, { status: 500 });
  }
}

/**
 * DELETE /api/catalogs/{catalogId}
 *
 * Deletes a specific user-created catalog.
 * Predefined catalogs cannot be deleted.
 * Deleting a catalog does not delete the routes associated with it.
 * Note: Currently uses DEFAULT_USER_ID. Authentication will be implemented later.
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
  request: NextRequest,
  context: { params: Promise<{ catalogId: string }> }
): Promise<NextResponse> {
  try {
    // Step 1: Initialize Supabase client
    const supabase = await createClient();

    // Step 2: Validate URL parameters
    const params = await context.params;
    const paramsValidation = catalogParamsSchema.safeParse(params);

    if (!paramsValidation.success) {
      return NextResponse.json(
        {
          error: "Invalid catalog ID.",
          details: paramsValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { catalogId } = paramsValidation.data;

    // Step 3: Authenticate user
    // TODO: Replace DEFAULT_USER_ID with actual authenticated user ID once auth is implemented
    // For now, we use the DEFAULT_USER_ID constant
    // In the future, this will be:
    // const { data: { user }, error: authError } = await supabase.auth.getUser();
    // if (authError || !user) {
    //   return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    // }
    const userId = DEFAULT_USER_ID;

    // Step 4: Fetch the catalog to verify existence and ownership
    const { data: catalog, error: fetchError } = await supabase
      .schema("pathly")
      .from("catalogs")
      .select("id, user_id, is_predefined")
      .eq("id", catalogId)
      .single();

    // Handle catalog not found
    if (fetchError || !catalog) {
      return NextResponse.json({ error: "Catalog not found." }, { status: 404 });
    }

    // Step 5: Authorization checks
    // Check if user owns the catalog
    if (catalog.user_id !== userId) {
      return NextResponse.json(
        { error: "Forbidden. You do not have permission to delete this catalog." },
        { status: 403 }
      );
    }

    // Check if catalog is predefined (system catalogs cannot be deleted)
    if (catalog.is_predefined) {
      return NextResponse.json({ error: "Forbidden. Predefined catalogs cannot be deleted." }, { status: 403 });
    }

    // Step 6: Delete the catalog from the database
    const { error: deleteError } = await supabase.schema("pathly").from("catalogs").delete().eq("id", catalogId);

    // Handle database errors during deletion
    if (deleteError) {
      // Log unexpected errors for debugging
      // eslint-disable-next-line no-console
      console.error("Database error while deleting catalog:", deleteError);
      return NextResponse.json({ error: "Internal server error. Please try again later." }, { status: 500 });
    }

    // Step 7: Return success response with 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Catch any unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in DELETE /api/catalogs/[catalogId]:", error);
    return NextResponse.json({ error: "Internal server error. Please try again later." }, { status: 500 });
  }
}
