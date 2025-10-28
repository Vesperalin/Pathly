/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Database } from "@/db/database.types";
import { createBrowserClient } from "@supabase/ssr";

export const DEFAULT_USER_ID = "10c1788f-d7f1-4647-9c8f-15fe7e500783";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
