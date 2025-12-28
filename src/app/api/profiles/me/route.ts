import { getProfile, updateProfile } from "@/features/profiles/profile.service";
import { UpdateProfileCommandSchema } from "@/features/profiles/validation";
import { handleApiError } from "@/lib/apiErrors";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/profiles/me
 *
 * Retrieves the profile information of the currently authenticated user.
 *
 * @returns {ProfileDto} User's profile data including id, language, theme, and created_at
 *
 * @throws {401} If the user is not authenticated
 * @throws {404} If the user's profile does not exist
 * @throws {500} If an internal server error occurs
 */
export async function GET() {
  try {
    // Initialize Supabase server client
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the profile using the service layer
    const profile = await getProfile(supabase, user.id);

    // Handle profile not found
    if (!profile) {
      throw new NotFoundError("Profile not found for the current user.");
    }

    // Return the profile data
    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/profiles/me
 *
 * Updates the profile information of the currently authenticated user.
 * Only the fields provided in the request body will be updated.
 *
 * @param {NextRequest} request - The incoming request containing the profile update data
 * @returns {ProfileDto} Updated user's profile data including id, language, theme, and created_at
 *
 * @throws {400} If the request body is invalid or fails validation
 * @throws {401} If the user is not authenticated
 * @throws {404} If the user's profile does not exist
 * @throws {500} If an internal server error occurs
 */
export async function PATCH(request: NextRequest) {
  try {
    // Initialize Supabase server client
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      throw new ValidationError("Invalid request body", [
        {
          code: "invalid_json",
          message: "Invalid request body.",
          path: ["body"],
        },
      ]);
    }

    // Validate the request body against the schema
    const validation = UpdateProfileCommandSchema.safeParse(requestBody);
    if (!validation.success) {
      throw new ValidationError("Invalid request body", validation.error.issues);
    }

    const validatedData = validation.data;

    // Update the profile using the service layer
    const updatedProfile = await updateProfile(supabase, user.id, validatedData);

    // Return the updated profile data
    return NextResponse.json(updatedProfile, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
