import AllRoutesView from "@/app/[locale]/(private)/routes/_components/AllRoutesView";
import { GetRoutesQuerySchema, type GetRoutesQuery } from "@/features/routes/validation";
import type { PaginatedRoutesDto } from "@/types";
import { cookies, headers } from "next/headers";

interface AllRoutesPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

async function resolveBaseUrl(): Promise<string> {
  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const host = headerStore.get("host");

  if (host) {
    const protocol = forwardedProto ?? "http";
    return `${protocol}://${host}`;
  }

  const fallback = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "";
  if (fallback.startsWith("http")) {
    return fallback;
  }
  if (fallback) {
    return `https://${fallback}`;
  }

  return "http://localhost:3000";
}

function coerceQuery(searchParams: Record<string, string | string[] | undefined>): GetRoutesQuery {
  const extractValue = (value: string | string[] | undefined) => {
    if (Array.isArray(value)) {
      return value.at(-1) ?? undefined;
    }
    return value;
  };

  const parsed = GetRoutesQuerySchema.parse({
    page: extractValue(searchParams.page),
    page_size: extractValue(searchParams.page_size),
    sort_by: extractValue(searchParams.sort_by),
    order: extractValue(searchParams.order),
    search: extractValue(searchParams.search),
  });

  return parsed;
}

async function fetchRoutes(query: GetRoutesQuery): Promise<PaginatedRoutesDto> {
  const baseUrl = await resolveBaseUrl();
  const url = new URL("/api/routes", baseUrl);

  url.searchParams.set("page", String(query.page));
  url.searchParams.set("page_size", String(query.page_size));
  url.searchParams.set("sort_by", query.sort_by);
  url.searchParams.set("order", query.order);
  if (query.search) {
    url.searchParams.set("search", query.search);
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch routes.", response.status, errorText);
    throw new Error("Failed to fetch routes.");
  }

  return (await response.json()) as PaginatedRoutesDto;
}

export default async function AllRoutesPage({ searchParams }: AllRoutesPageProps) {
  const query = coerceQuery(searchParams);
  const initialData = await fetchRoutes(query);

  const normalizedSearchParams: Record<string, string | undefined> = {
    page: String(query.page),
    page_size: String(query.page_size),
    sort_by: query.sort_by,
    order: query.order,
  };

  if (query.search) {
    normalizedSearchParams.search = query.search;
  }

  return <AllRoutesView initialData={initialData} searchParams={normalizedSearchParams} />;
}
