import { getAllMountainGroups } from "@/features/mountain-groups/mountain-groups.service";
import { handleApiError } from "@/lib/apiErrors";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/mountain-groups
 *
 * Retrieves all available mountain groups from the database.
 * Mountain groups are used for categorizing hiking routes in the GOT badge system.
 * Note: Authentication will be implemented later. Currently accessible without user context.
 *
 * @returns {Promise<NextResponse<MountainGroupDto[]>>} Array of mountain groups
 *
 * @throws {500} Internal Server Error - When database query fails
 */
export async function GET() {
  try {
    // Initialize Supabase server client
    const supabase = await createClient();

    // Get all mountain groups using the service layer
    const mountainGroups = await getAllMountainGroups(supabase);

    // Return the mountain groups array with 200 OK status
    return NextResponse.json(mountainGroups, {
      status: 200,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
