import type { Database } from "@/db/database.types";
import type { MountainGroupDto } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Service layer for mountain group-related operations.
 * Handles business logic and database interactions for mountain groups.
 */

/**
 * Retrieves all available mountain groups.
 * Mountain groups are public data and don't require user authentication.
 *
 * @param supabase - Supabase client instance
 * @returns Array of all mountain groups ordered by name
 * @throws Error if the database operation fails
 */
export async function getAllMountainGroups(supabase: SupabaseClient<Database>): Promise<MountainGroupDto[]> {
  const { data: groups, error: dbError } = await supabase
    .schema("pathly")
    .from("mountain_groups")
    .select("*")
    .order("name", { ascending: true });

  if (dbError) {
    console.error("DB error fetching mountain groups:", dbError);
    throw new Error("Failed to fetch mountain groups");
  }

  return groups as MountainGroupDto[];
}
