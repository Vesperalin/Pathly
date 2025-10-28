import { DEFAULT_USER_ID } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import type { ProfileDto } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Zod schema for validating PATCH /api/profiles/me request body.
 * Validates the UpdateProfileCommand type.
 */
const updateProfileSchema = z.object({
  language: z.enum(["pl", "en"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

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

    // TODO: Replace with actual authentication when implemented
    const userId = DEFAULT_USER_ID;

    // Query the profiles table for the user
    const { data: profile, error: dbError } = await supabase
      .schema("pathly")
      .from("profiles")
      .select("id, language, theme, created_at")
      .eq("id", userId)
      .single();

    // Handle database errors
    if (dbError) {
      // PGRST116 is the PostgREST error code for "no rows returned"
      if (dbError.code === "PGRST116") {
        return NextResponse.json({ error: "Profile not found for the current user." }, { status: 404 });
      }

      // Log unexpected database errors for debugging (in production, use proper logging service)
      if (process.env.NODE_ENV === "development") {
        console.error("Database error fetching profile:", dbError);
      }
      return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
    }

    // Handle case where query succeeds but returns no data
    if (!profile) {
      return NextResponse.json({ error: "Profile not found for the current user." }, { status: 404 });
    }

    // Return the profile data as ProfileDto
    const profileDto: ProfileDto = {
      id: profile.id,
      language: profile.language,
      theme: profile.theme,
      created_at: profile.created_at,
    };

    return NextResponse.json(profileDto, { status: 200 });
  } catch (error) {
    // Catch any unexpected errors that weren't handled above
    if (process.env.NODE_ENV === "development") {
      console.error("Unexpected error in GET /api/profiles/me:", error);
    }
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
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

    // TODO: Replace with actual authentication when implemented
    const userId = DEFAULT_USER_ID;

    // Parse the request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body.", details: "Request body must be valid JSON." },
        { status: 400 }
      );
    }

    // Validate the request body against the schema
    const validation = updateProfileSchema.safeParse(requestBody);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request body.",
          details: validation.error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Update the profile in the database
    const { data: updatedProfile, error: dbError } = await supabase
      .schema("pathly")
      .from("profiles")
      .update(validatedData)
      .eq("id", userId)
      .select("id, language, theme, created_at")
      .single();

    // Handle database errors
    if (dbError) {
      // PGRST116 is the PostgREST error code for "no rows returned"
      if (dbError.code === "PGRST116") {
        return NextResponse.json({ error: "Profile not found for the current user." }, { status: 404 });
      }

      // Log unexpected database errors for debugging (in production, use proper logging service)
      if (process.env.NODE_ENV === "development") {
        console.error("Database error updating profile:", dbError);
      }
      return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
    }

    // Handle case where query succeeds but returns no data
    if (!updatedProfile) {
      return NextResponse.json({ error: "Profile not found for the current user." }, { status: 404 });
    }

    // Return the updated profile data as ProfileDto
    const profileDto: ProfileDto = {
      id: updatedProfile.id,
      language: updatedProfile.language,
      theme: updatedProfile.theme,
      created_at: updatedProfile.created_at,
    };

    return NextResponse.json(profileDto, { status: 200 });
  } catch (error) {
    // Catch any unexpected errors that weren't handled above
    if (process.env.NODE_ENV === "development") {
      console.error("Unexpected error in PATCH /api/profiles/me:", error);
    }
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
