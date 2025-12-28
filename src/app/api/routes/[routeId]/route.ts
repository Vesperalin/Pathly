import { getRouteDetails, updateRoute } from "@/features/routes/route.service";
import { RouteIdParamSchema, UpdateRouteCommandSchema } from "@/features/routes/validation";
import { handleApiError } from "@/lib/apiErrors";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * DELETE /api/routes/{routeId}
 *
 * Permanently deletes a route owned by the authenticated user.
 * The operation is idempotent - deleting a non-existent route returns 404.
 * Related records in route_catalogs and route_mountain_groups are automatically
 * deleted via ON DELETE CASCADE constraints.
 *
 * Path Parameters:
 * - routeId: UUID - The unique identifier of the route to delete
 *
 * @param request - The incoming Request object (unused for DELETE)
 * @param context - Context object containing route parameters
 * @returns A NextResponse with 204 No Content on success or an error
 *
 * Response Status Codes:
 * - 204: Route successfully deleted
 * - 400: Invalid routeId format (not a valid UUID)
 * - 401: Unauthorized (user not authenticated)
 * - 403: User does not own the route
 * - 404: Route not found
 * - 500: Internal server error
 */
export async function DELETE(_request: Request, context: { params: Promise<{ routeId: string }> }) {
  try {
    // Step 1: Initialize Supabase server client
    const supabase = await createClient();

    // Step 2: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 3: Validate routeId parameter
    const params = await context.params;
    const validationResult = RouteIdParamSchema.safeParse({ routeId: params.routeId });

    if (!validationResult.success) {
      throw new ValidationError("Invalid route ID format.", validationResult.error.issues);
    }

    const { routeId } = validationResult.data;

    // Step 4: Fetch route to verify existence and ownership
    const { data: route, error: fetchError } = await supabase
      .schema("pathly")
      .from("routes")
      .select("user_id")
      .eq("id", routeId)
      .single();

    if (fetchError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Database error fetching route for deletion:", fetchError);
      }

      // If the error code indicates no rows, the route doesn't exist
      if (fetchError.code === "PGRST116") {
        throw new NotFoundError("Route not found.");
      }

      // For other database errors, throw a generic server error
      throw new Error(fetchError.message);
    }

    if (!route) {
      throw new NotFoundError("Route not found.");
    }

    // Step 5: Verify ownership - user must own the route to delete it
    if (route.user_id !== user.id) {
      throw new ForbiddenError("You do not have permission to delete this route.");
    }

    // Step 6: Execute deletion
    // ON DELETE CASCADE will automatically remove related records
    const { error: deleteError } = await supabase.schema("pathly").from("routes").delete().eq("id", routeId);

    if (deleteError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Database error deleting route:", deleteError);
      }
      throw new Error(deleteError.message);
    }

    // Step 7: Return success response with 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/routes/[routeId]
 *
 * Retrieves detailed information about a specific route owned by the authenticated user,
 * including its associated mountain groups and catalogs.
 *
 * Path Parameters:
 * - routeId: string (UUID) - The unique identifier of the route
 *
 * @param request - The incoming Request object (unused but required by Next.js)
 * @param context - Contains the dynamic route parameters
 * @returns A NextResponse containing the route details or an error message
 *
 * Response Status Codes:
 * - 200: Route retrieved successfully
 * - 400: Invalid route ID format (not a valid UUID)
 * - 401: Unauthorized (user not authenticated)
 * - 404: Route not found or does not belong to the user
 * - 500: Internal server error
 */
export async function GET(_request: Request, context: { params: Promise<{ routeId: string }> }) {
  try {
    // Step 1: Initialize Supabase server client
    const supabase = await createClient();

    // Step 2: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 3: Extract and validate routeId parameter
    const params = await context.params;
    const validationResult = RouteIdParamSchema.safeParse(params);

    if (!validationResult.success) {
      throw new ValidationError("Invalid route ID format.", validationResult.error.issues);
    }

    const { routeId } = validationResult.data;

    // Step 4: Fetch route details using the service layer
    const route = await getRouteDetails(supabase, routeId, user.id);

    // Step 5: Handle not found case
    if (!route) {
      throw new NotFoundError("The requested route does not exist or you do not have permission to access it.");
    }

    // Step 6: Return the route details
    return NextResponse.json(route, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/routes/[routeId]
 *
 * Updates an existing route's details and associations for the authenticated user.
 * Allows partial updates of user-editable fields. GPX-derived data cannot be modified.
 *
 * Path Parameters:
 * - routeId: string (UUID) - The unique identifier of the route to update
 *
 * Request Body (all fields optional):
 * - name: string - The route's name
 * - route_date: string (YYYY-MM-DD) - The date the route was completed
 * - got_points: number | null - Points earned according to GOT regulations
 * - notes: string | null - User notes about the route
 * - mountain_group_ids: string[] - Array of mountain group UUIDs to associate
 * - catalog_ids: string[] - Array of catalog UUIDs to associate
 *
 * @param request - The incoming Request object
 * @param context - Contains the dynamic route parameters
 * @returns A NextResponse containing the updated route details or an error message
 *
 * Response Status Codes:
 * - 200: Route updated successfully
 * - 400: Invalid request (bad route ID or request body)
 * - 401: Unauthorized (not authenticated)
 * - 403: Forbidden (user does not own the route)
 * - 404: Route not found, or invalid catalog/mountain group IDs
 * - 409: Conflict (duplicate route name for user)
 * - 500: Internal server error
 */
export async function PATCH(request: Request, context: { params: Promise<{ routeId: string }> }) {
  try {
    // Step 1: Initialize Supabase server client
    const supabase = await createClient();

    // Step 2: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 3: Extract and validate routeId parameter
    const params = await context.params;
    const paramValidation = RouteIdParamSchema.safeParse(params);

    if (!paramValidation.success) {
      throw new ValidationError("Invalid route ID format.", paramValidation.error.issues);
    }

    const { routeId } = paramValidation.data;

    // Step 4: Parse and validate request body
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

    const bodyValidation = UpdateRouteCommandSchema.safeParse(requestBody);

    if (!bodyValidation.success) {
      throw new ValidationError("Invalid request body.", bodyValidation.error.issues);
    }

    const validatedCommand = bodyValidation.data;

    // Step 5: Call the service layer to update the route
    const updatedRoute = await updateRoute(supabase, routeId, validatedCommand, user.id);

    // Step 6: Return the updated route details
    return NextResponse.json(updatedRoute, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
