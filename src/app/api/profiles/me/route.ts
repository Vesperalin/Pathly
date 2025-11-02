import { getProfile, updateProfile } from "@/features/profiles/profile.service";
import { UpdateProfileCommandSchema } from "@/features/profiles/validation";
import { handleApiError } from "@/lib/apiErrors";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { DEFAULT_USER_ID } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/profiles/me
 *
 * Retrieves the profile information of the currently authenticated user.
 * Note: Authentication is temporarily disabled. Using DEFAULT_USER_ID.
 *
 * @returns {ProfileDto} User's profile data including id, language, theme, and created_at
 *
 * @throws {404} If the user's profile does not exist
 * @throws {500} If an internal server error occurs
 */
export async function GET() {
  try {
    // Initialize Supabase server client
    const supabase = await createClient();

    // Get the profile using the service layer
    const profile = await getProfile(supabase, DEFAULT_USER_ID);

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
 * Note: Authentication is temporarily disabled. Using DEFAULT_USER_ID.
 *
 * @param {NextRequest} request - The incoming request containing the profile update data
 * @returns {ProfileDto} Updated user's profile data including id, language, theme, and created_at
 *
 * @throws {400} If the request body is invalid or fails validation
 * @throws {401} If the user is not authenticated (when auth is enabled)
 * @throws {404} If the user's profile does not exist
 * @throws {500} If an internal server error occurs
 */
export async function PATCH(request: NextRequest) {
  try {
    // Initialize Supabase server client
    const supabase = await createClient();

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
    const updatedProfile = await updateProfile(supabase, DEFAULT_USER_ID, validatedData);

    // Return the updated profile data
    return NextResponse.json(updatedProfile, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
