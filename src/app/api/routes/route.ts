import { createRoute } from "@/features/routes/route.service";
import { CreateRouteCommandSchema, GetRoutesQuerySchema } from "@/features/routes/validation";
import { handleApiError } from "@/lib/apiErrors";
import { ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { CreateRouteCommand, PaginatedRoutesDto, RouteDetailsDto, RoutePreviewDto } from "@/types";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * GET /api/routes
 *
 * Retrieves a paginated, filterable, and sortable list of routes for the authenticated user.
 * This endpoint is crucial for displaying the user's route history in the application.
 *
 * Query Parameters:
 * - page: number (optional, default: 1) - Page number for pagination
 * - page_size: number (optional, default: 10, max: 100) - Items per page
 * - sort_by: 'name' | 'route_date' (optional, default: 'route_date') - Sort field
 * - order: 'asc' | 'desc' (optional, default: 'desc') - Sort order
 * - search: string (optional) - Search term to filter routes by name
 *
 * @param request - The incoming NextRequest object
 * @returns A NextResponse containing paginated routes or an error message
 *
 * Response Status Codes:
 * - 200: Routes retrieved successfully
 * - 400: Invalid query parameters
 * - 401: Unauthorized (user not authenticated)
 * - 500: Internal server error
 */
export async function GET(request: NextRequest) {
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

    // Step 3: Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get("page"),
      page_size: searchParams.get("page_size"),
      sort_by: searchParams.get("sort_by"),
      order: searchParams.get("order"),
      search: searchParams.get("search"),
    };

    const validationResult = GetRoutesQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      throw new ValidationError("Invalid query parameters", validationResult.error.issues);
    }

    const { page, page_size, sort_by, order, search } = validationResult.data;

    // Step 4: Calculate pagination range
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;

    // Step 5: Build the Supabase query
    let query = supabase
      .schema("pathly")
      .from("routes")
      .select("id, name, route_date, got_points, distance", { count: "exact" })
      .eq("user_id", user.id);

    // Apply search filter if provided
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: order === "asc" });

    // Apply pagination
    query = query.range(from, to);

    // Step 6: Execute the query
    const { data: routes, error: dbError, count } = await query;

    if (dbError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Database error in GET /api/routes:", dbError);
      }
      throw new Error(`Failed to fetch routes: ${dbError.message}`);
    }

    // Step 7: Format the response
    const response: PaginatedRoutesDto = {
      data: (routes || []) as RoutePreviewDto[],
      pagination: {
        page,
        page_size,
        total: count || 0,
      },
    };

    // Step 8: Return the paginated response
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/routes
 *
 * Creates a new hiking route with optional associations to mountain groups and catalogs.
 * This endpoint is typically used after GPX files have been parsed to obtain route metrics.
 *
 * Request Body:
 * - name: string (required) - Route name
 * - route_date: string (required) - Date in YYYY-MM-DD format
 * - distance: number (required) - Distance in kilometers
 * - total_ascent: number (required) - Total ascent in meters
 * - total_descent: number (required) - Total descent in meters
 * - duration: number (required) - Duration in minutes
 * - got_points: number (optional) - GOT points earned
 * - notes: string (optional) - Additional notes
 * - mountain_group_ids: string[] (optional) - Array of mountain group UUIDs
 * - catalog_ids: string[] (optional) - Array of catalog UUIDs
 *
 * @param request - The incoming NextRequest object
 * @returns A NextResponse containing the created route or an error message
 *
 * Response Status Codes:
 * - 201: Route created successfully
 * - 400: Invalid request body or validation failure
 * - 401: Unauthorized (user not authenticated)
 * - 409: Route with the same name already exists
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
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

    // Step 3: Parse and validate request body
    let requestBody: unknown;
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

    const validationResult = CreateRouteCommandSchema.safeParse(requestBody);

    if (!validationResult.success) {
      throw new ValidationError("Validation failed", validationResult.error.issues);
    }

    const validatedData: CreateRouteCommand = validationResult.data;

    // Step 4: Call the service layer to create the route
    const createdRoute: RouteDetailsDto = await createRoute(supabase, validatedData, user.id);

    // Step 5: Return the created route
    return NextResponse.json(createdRoute, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
