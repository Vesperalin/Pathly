import { getCatalogs } from "@/features/catalogs/catalog.service";
import { GetCatalogsQuerySchema } from "@/features/catalogs/validation";
import { DEFAULT_USER_ID } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import type { CatalogPreviewDto, CreateCatalogCommand, PaginatedCatalogsDto } from "@/types";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Zod schema for validating the request body when creating a new catalog.
 * Ensures the name is a non-empty string with a maximum length of 255 characters.
 */
const createCatalogSchema = z.object({
  name: z.string().min(1, "Name is required.").max(255, "Name must not exceed 255 characters."),
});

/**
 * GET /api/catalogs
 *
 * Retrieves a paginated list of all catalogs for the user.
 * Supports filtering by type, sorting, and pagination.
 * Note: Currently uses DEFAULT_USER_ID. Authentication will be implemented later.
 *
 * Query Parameters:
 * - type: 'predefined' | 'user' (optional) - Filter catalogs by type
 * - page: number (optional, default: 1) - Page number for pagination
 * - page_size: number (optional, default: 10, max: 100) - Items per page
 * - sort_by: 'name' | 'created_at' (optional, default: 'name') - Sort field
 * - order: 'asc' | 'desc' (optional, default: 'asc') - Sort order
 *
 * @param request - The incoming NextRequest object
 * @returns A NextResponse containing paginated catalogs or an error message
 *
 * Response Status Codes:
 * - 200: Catalogs retrieved successfully
 * - 400: Invalid query parameters
 * - 500: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = await createClient();

    // Step 1: Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      type: searchParams.get("type"),
      page: searchParams.get("page"),
      page_size: searchParams.get("page_size"),
      sort_by: searchParams.get("sort_by"),
      order: searchParams.get("order"),
    };

    const validationResult = GetCatalogsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters.",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const validatedParams = validationResult.data;

    // Step 2: Fetch catalogs using the service layer
    // TODO: Replace DEFAULT_USER_ID with actual authenticated user ID once auth is implemented
    const result: PaginatedCatalogsDto = await getCatalogs(supabase, DEFAULT_USER_ID, validatedParams);

    // Step 3: Return the paginated response
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Catch any unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/catalogs:", error);
    // eslint-disable-next-line no-console
    console.error("Error details:", error instanceof Error ? error.message : String(error));
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
 * POST /api/catalogs
 *
 * Creates a new catalog for the user.
 * Note: Currently uses DEFAULT_USER_ID. Authentication will be implemented later.
 *
 * @param request - The incoming NextRequest object
 * @returns A NextResponse containing the created catalog or an error message
 *
 * Response Status Codes:
 * - 201: Catalog created successfully
 * - 400: Invalid request body or validation failure
 * - 409: Catalog with the same name already exists for this user
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = await createClient();

    // Step 1: Validate the request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }

    const validationResult = createCatalogSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const validatedData: CreateCatalogCommand = validationResult.data;

    // Step 2: Insert the new catalog into the database
    // TODO: Replace DEFAULT_USER_ID with actual authenticated user ID once auth is implemented
    const { data: newCatalog, error: dbError } = await supabase
      .schema("pathly")
      .from("catalogs")
      .insert({
        name: validatedData.name,
        user_id: DEFAULT_USER_ID,
      })
      .select()
      .single();

    // Handle database errors
    if (dbError) {
      // Check for unique constraint violation (duplicate catalog name for this user)
      if (dbError.code === "23505") {
        return NextResponse.json(
          { error: `A catalog with the name "${validatedData.name}" already exists.` },
          { status: 409 }
        );
      }

      // Log the error for debugging (in production, use a proper logging service)
      // eslint-disable-next-line no-console
      console.error("Database error while creating catalog:", dbError);

      return NextResponse.json({ error: "An unexpected error occurred while creating the catalog." }, { status: 500 });
    }

    // Step 3: Format and return the response
    const response: CatalogPreviewDto = {
      id: newCatalog.id,
      name: newCatalog.name,
      is_predefined: newCatalog.is_predefined,
      total_points: 0, // New catalogs start with 0 points
      created_at: newCatalog.created_at,
      updated_at: newCatalog.updated_at,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    // Catch any unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in POST /api/catalogs:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
