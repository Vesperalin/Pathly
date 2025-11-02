/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Database } from "@/db/database.types";
import { createBrowserClient } from "@supabase/ssr";

export const DEFAULT_USER_ID = "1dde3fc8-e186-44b7-ae1b-e2106f3bd29b";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
