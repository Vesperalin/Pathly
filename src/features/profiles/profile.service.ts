import type { Database } from "@/db/database.types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { ProfileDto, UpdateProfileCommand } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Service layer for profile-related operations.
 * Handles business logic and database interactions for user profiles.
 */

/**
 * Retrieves a user's profile information.
 *
 * @param supabase - Supabase client instance
 * @param userId - The authenticated user's ID
 * @returns The user's profile DTO or null if not found
 * @throws Error for database errors
 */
export async function getProfile(supabase: SupabaseClient<Database>, userId: string): Promise<ProfileDto | null> {
  const { data: profile, error: dbError } = await supabase
    .schema("pathly")
    .from("profiles")
    .select("id, language, theme, created_at")
    .eq("id", userId)
    .single();

  if (dbError && dbError.code !== "PGRST116") {
    console.error("DB error fetching profile:", dbError);
    throw new Error("Failed to fetch profile");
  }

  if (!profile) return null;

  return {
    id: profile.id,
    language: profile.language,
    theme: profile.theme,
    created_at: profile.created_at,
  };
}

/**
 * Updates a user's profile information.
 *
 * @param supabase - Supabase client instance
 * @param userId - The authenticated user's ID
 * @param command - The profile update command containing fields to update
 * @returns The updated profile DTO
 * @throws NotFoundError if the profile doesn't exist
 * @throws ValidationError if the update command is empty
 * @throws Error for other database errors
 */
export async function updateProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  command: UpdateProfileCommand
): Promise<ProfileDto> {
  // Validate that at least one field is provided
  if (Object.keys(command).length === 0) {
    throw new ValidationError("At least one field must be provided for update");
  }

  const { data: updatedProfile, error: dbError } = await supabase
    .schema("pathly")
    .from("profiles")
    .update(command)
    .eq("id", userId)
    .select("id, language, theme, created_at")
    .single();

  if (dbError) {
    if (dbError.code === "PGRST116") {
      throw new NotFoundError("Profile not found");
    }
    console.error("DB error updating profile:", dbError);
    throw new Error("Failed to update profile");
  }

  if (!updatedProfile) {
    throw new NotFoundError("Profile update failed: No data returned");
  }

  return {
    id: updatedProfile.id,
    language: updatedProfile.language,
    theme: updatedProfile.theme,
    created_at: updatedProfile.created_at,
  };
}
