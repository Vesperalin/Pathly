import EditRouteView from "@/app/[locale]/(private)/routes/[routeId]/edit/_components/EditRouteView";
import type { CatalogPreviewDto, MountainGroupDto, RouteDetailsDto } from "@/types";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";

interface EditRoutePageParams {
  routeId?: string;
}

interface EditRoutePageProps {
  params: EditRoutePageParams | Promise<EditRoutePageParams>;
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

async function createAuthenticatedRequestInit(): Promise<RequestInit> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  return {
    headers: {
      Accept: "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    cache: "no-store",
    next: { revalidate: 0 },
  } satisfies RequestInit;
}

async function fetchRouteDetails(routeId: string): Promise<RouteDetailsDto> {
  const baseUrl = await resolveBaseUrl();
  const url = new URL(`/api/routes/${routeId}`, baseUrl);

  const response = await fetch(url.toString(), await createAuthenticatedRequestInit());

  if (response.status === 404 || response.status === 403) {
    notFound();
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to fetch route details for ${routeId}.`, response.status, errorText);
    throw new Error("Failed to fetch route details.");
  }

  return (await response.json()) as RouteDetailsDto;
}

async function fetchCatalogsByType(type: "user" | "predefined"): Promise<CatalogPreviewDto[]> {
  const baseUrl = await resolveBaseUrl();
  const url = new URL("/api/catalogs", baseUrl);
  url.searchParams.set("type", type);
  url.searchParams.set("page", "1");
  url.searchParams.set("page_size", "100");

  const response = await fetch(url.toString(), await createAuthenticatedRequestInit());

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to fetch ${type} catalogs.`, response.status, errorText);
    throw new Error("Failed to fetch catalogs.");
  }

  const payload = (await response.json()) as { data: CatalogPreviewDto[] };
  return payload.data;
}

async function fetchMountainGroups(): Promise<MountainGroupDto[]> {
  const baseUrl = await resolveBaseUrl();
  const url = new URL("/api/mountain-groups", baseUrl);

  const response = await fetch(url.toString(), await createAuthenticatedRequestInit());

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch mountain groups.", response.status, errorText);
    throw new Error("Failed to fetch mountain groups.");
  }

  return (await response.json()) as MountainGroupDto[];
}

export default async function EditRoutePage({ params }: EditRoutePageProps) {
  const resolvedParams = await params;
  const routeId = resolvedParams.routeId;

  if (!routeId) {
    notFound();
  }

  const [route, userCatalogs, predefinedCatalogs, mountainGroups] = await Promise.all([
    fetchRouteDetails(routeId),
    fetchCatalogsByType("user"),
    fetchCatalogsByType("predefined"),
    fetchMountainGroups(),
  ]);

  const catalogs: CatalogPreviewDto[] = [...predefinedCatalogs, ...userCatalogs];

  return <EditRouteView route={route} catalogs={catalogs} mountainGroups={mountainGroups} />;
}
