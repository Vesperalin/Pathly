import { createCatalog, getCatalogs } from "@/features/catalogs/catalog.service";
import { CreateCatalogCommandSchema, GetCatalogsQuerySchema } from "@/features/catalogs/validation";
import { handleApiError } from "@/lib/apiErrors";
import { ValidationError } from "@/lib/errors";
import { DEFAULT_USER_ID } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import type { CreateCatalogCommand, PaginatedCatalogsDto } from "@/types";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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
      throw new ValidationError("Invalid query parameters", validationResult.error.issues);
    }

    const validatedParams = validationResult.data;

    // Step 2: Fetch catalogs using the service layer
    // TODO: Replace DEFAULT_USER_ID with actual authenticated user ID once auth is implemented
    const result: PaginatedCatalogsDto = await getCatalogs(supabase, DEFAULT_USER_ID, validatedParams);

    // Step 3: Return the paginated response
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError(error);
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
      throw new ValidationError("Invalid JSON in request body.", [
        {
          code: "invalid_json",
          message: "Invalid JSON in request body.",
          path: ["body"],
        },
      ]);
    }

    const validationResult = CreateCatalogCommandSchema.safeParse(requestBody);

    if (!validationResult.success) {
      throw new ValidationError("Validation failed", validationResult.error.issues);
    }

    const validatedData: CreateCatalogCommand = validationResult.data;

    // Step 2: Create the catalog using the service layer
    const newCatalog = await createCatalog(supabase, validatedData, DEFAULT_USER_ID);

    // Step 3: Return the created catalog
    return NextResponse.json(newCatalog, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
