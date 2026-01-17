import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_EMAIL_PREFIX = "pathly.e2e";
const LIST_USERS_PAGE_SIZE = 100;

interface CleanupConfig {
  url: string;
  serviceKey: string;
  emailPrefix: string;
}

// Wymagane zmienne środowiskowe opisano w `.env.example`.
function resolveCleanupConfig(): CleanupConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_ACCESS_TOKEN ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return null;
  }

  return { url, serviceKey, emailPrefix: DEFAULT_EMAIL_PREFIX };
}

function matchesPrefix(email: string, prefix: string) {
  if (!email) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPrefix = prefix.trim().toLowerCase();
  const prefixWithPlus = normalizedPrefix.endsWith("+") ? normalizedPrefix : `${normalizedPrefix}+`;

  return normalizedEmail.startsWith(prefixWithPlus) || normalizedEmail.startsWith(normalizedPrefix);
}

type AdminSupabaseClient = SupabaseClient<any, string, string, any, any>;

async function purgeUsers(client: AdminSupabaseClient, prefix: string) {
  let currentPage = 1;
  while (true) {
    const { data, error } = await client.auth.admin.listUsers({
      page: currentPage,
      perPage: LIST_USERS_PAGE_SIZE,
    });

    if (error) {
      throw new Error(`Playwright teardown: nie można pobrać listy użytkowników Supabase (${error.message})`);
    }

    const users = data?.users ?? [];
    const candidates = users.filter((user) => matchesPrefix(user.email ?? "", prefix));

    for (const user of candidates) {
      const { error: deleteError } = await client.auth.admin.deleteUser(user.id);
      if (deleteError) {
        throw new Error(
          `Playwright teardown: nie można usunąć użytkownika Supabase ${user.id} (${deleteError.message})`
        );
      }
    }

    const perPage = data?.per_page ?? LIST_USERS_PAGE_SIZE;
    const totalPages = data?.total && perPage ? Math.max(1, Math.ceil(data.total / perPage)) : null;
    const hasMore = totalPages !== null ? currentPage < totalPages : users.length === perPage && users.length > 0;

    if (!hasMore) {
      break;
    }

    currentPage += 1;
  }
}

export default async function globalTeardown() {
  const config = resolveCleanupConfig();
  if (!config) {
    console.info("Playwright teardown: brak wymaganych zmiennych środowiskowych Supabase. Czyszczenie pominięte.");
    return;
  }

  const client = createClient(config.url, config.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await purgeUsers(client, config.emailPrefix);
}
