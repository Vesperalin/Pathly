import { createClient } from "@/lib/supabase/server";
import type { MountainGroupDto } from "@/types";
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

    // Query all mountain groups from the database, ordered alphabetically by name
    const { data: mountainGroups, error: queryError } = await supabase
      .schema("pathly")
      .from("mountain_groups")
      .select("*")
      .order("name", { ascending: true });

    // Handle database query errors
    if (queryError) {
      // Log error for debugging (use proper logging service in production)
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch mountain groups:", queryError);
      }
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    // Return the mountain groups array with 200 OK status
    return NextResponse.json(mountainGroups as MountainGroupDto[], {
      status: 200,
    });
  } catch (error) {
    // Handle unexpected errors that weren't caught above
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Unexpected error in GET /api/mountain-groups:", error);
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
