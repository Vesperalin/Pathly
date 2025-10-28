import { createRoute } from "@/features/routes/route.service";
import { GetRoutesQuerySchema } from "@/features/routes/validation";
import { DEFAULT_USER_ID } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import type { CreateRouteCommand, PaginatedRoutesDto, RouteDetailsDto, RoutePreviewDto } from "@/types";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * GET /api/routes
 *
 * Retrieves a paginated, filterable, and sortable list of routes for the user.
 * This endpoint is crucial for displaying the user's route history in the application.
 * Note: Currently uses DEFAULT_USER_ID. Authentication will be implemented later.
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
 * - 500: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Initialize Supabase server client
    const supabase = await createClient();

    // Step 2: Parse and validate query parameters
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
      return NextResponse.json(
        {
          error: "Invalid query parameters.",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { page, page_size, sort_by, order, search } = validationResult.data;

    // Step 3: Calculate pagination range
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;

    // Step 4: Build the Supabase query
    // TODO: Replace DEFAULT_USER_ID with actual authenticated user ID once auth is implemented
    let query = supabase
      .schema("pathly")
      .from("routes")
      .select("id, name, route_date, got_points, distance", { count: "exact" })
      .eq("user_id", DEFAULT_USER_ID);

    // Apply search filter if provided
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: order === "asc" });

    // Apply pagination
    query = query.range(from, to);

    // Step 5: Execute the query
    const { data: routes, error: dbError, count } = await query;

    if (dbError) {
      // eslint-disable-next-line no-console
      console.error("Database error in GET /api/routes:", dbError);
      return NextResponse.json(
        {
          error: "An unexpected error occurred while fetching routes.",
          message: dbError.message,
        },
        { status: 500 }
      );
    }

    // Step 6: Format the response
    const response: PaginatedRoutesDto = {
      data: (routes || []) as RoutePreviewDto[],
      pagination: {
        page,
        page_size,
        total: count || 0,
      },
    };

    // Step 7: Return the paginated response
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // Catch any unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/routes:", error);
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
 * Zod schema for validating the request body when creating a new route.
 * Enforces all validation rules for route creation.
 */
const CreateRouteCommandSchema = z.object({
  name: z.string().min(1, "Route name is required").max(255, "Route name must not exceed 255 characters"),
  route_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Route date must be in YYYY-MM-DD format"),
  distance: z.number().min(0, "Distance must be a non-negative number"),
  total_ascent: z.number().min(0, "Total ascent must be a non-negative number"),
  total_descent: z.number().min(0, "Total descent must be a non-negative number"),
  duration: z.number().int().min(0, "Duration must be a non-negative integer"),
  got_points: z.number().min(0, "GOT points must be a non-negative number").optional(),
  notes: z.string().optional(),
  mountain_group_ids: z.array(z.string().uuid("Each mountain group ID must be a valid UUID")).optional(),
  catalog_ids: z.array(z.string().uuid("Each catalog ID must be a valid UUID")).optional(),
});

/**
 * POST /api/routes
 *
 * Creates a new hiking route with optional associations to mountain groups and catalogs.
 * This endpoint is typically used after GPX files have been parsed to obtain route metrics.
 * Note: Currently uses DEFAULT_USER_ID. Authentication will be implemented later.
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
 * - 409: Route with the same name already exists
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Initialize Supabase server client
    const supabase = await createClient();

    // Step 2: Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }

    const validationResult = CreateRouteCommandSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const validatedData: CreateRouteCommand = validationResult.data;

    // Step 3: Call the service layer to create the route
    // TODO: Replace DEFAULT_USER_ID with actual authenticated user ID once auth is implemented
    const createdRoute: RouteDetailsDto = await createRoute(supabase, validatedData, DEFAULT_USER_ID);

    // Step 4: Return the created route
    return NextResponse.json(createdRoute, { status: 201 });
  } catch (error) {
    // Handle specific error types
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for duplicate route name
    if (errorMessage.includes("A route with the name")) {
      return NextResponse.json({ error: errorMessage }, { status: 409 });
    }

    // Check for validation errors from the service layer
    if (
      errorMessage.includes("catalog") ||
      errorMessage.includes("mountain group") ||
      errorMessage.includes("GOT points")
    ) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Log unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in POST /api/routes:", error);
    return NextResponse.json(
      {
        error: "An unexpected server error occurred.",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
