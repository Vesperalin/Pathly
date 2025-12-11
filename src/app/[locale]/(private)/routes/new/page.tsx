import AddRouteView from "@/app/[locale]/(private)/routes/new/_components/AddRouteView";
import type { CatalogPreviewDto, MountainGroupDto, PaginatedCatalogsDto } from "@/types";
import { cookies, headers } from "next/headers";

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

async function fetchCatalogsByType(type: "user" | "predefined"): Promise<CatalogPreviewDto[]> {
  const baseUrl = await resolveBaseUrl();
  const url = new URL("/api/catalogs", baseUrl);
  url.searchParams.set("type", type);
  url.searchParams.set("page", "1");
  url.searchParams.set("page_size", "100");

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
    console.error("Failed to fetch catalogs.", response.status, errorText);
    throw new Error("Failed to fetch catalogs.");
  }

  const payload = (await response.json()) as PaginatedCatalogsDto;
  return payload.data;
}

async function fetchMountainGroups(): Promise<MountainGroupDto[]> {
  const baseUrl = await resolveBaseUrl();
  const url = new URL("/api/mountain-groups", baseUrl);

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
    console.error("Failed to fetch mountain groups.", response.status, errorText);
    throw new Error("Failed to fetch mountain groups.");
  }

  return (await response.json()) as MountainGroupDto[];
}

export default async function AddRoutePage() {
  const [userCatalogs, predefinedCatalogs, mountainGroups] = await Promise.all([
    fetchCatalogsByType("user"),
    fetchCatalogsByType("predefined"),
    fetchMountainGroups(),
  ]);

  const catalogs: CatalogPreviewDto[] = [...predefinedCatalogs, ...userCatalogs];

  return <AddRouteView catalogs={catalogs} mountainGroups={mountainGroups} />;
}
