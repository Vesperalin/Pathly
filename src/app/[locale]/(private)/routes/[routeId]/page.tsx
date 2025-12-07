import RouteDetailsView from "@/app/[locale]/(private)/routes/[routeId]/_components/RouteDetailsView";
import type { RouteDetailsDto } from "@/types";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";

interface RouteDetailsPageProps {
  params:
    | Promise<{
        routeId?: string;
      }>
    | {
        routeId?: string;
      };
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

async function fetchRouteDetails(routeId: string): Promise<RouteDetailsDto> {
  const baseUrl = await resolveBaseUrl();
  const url = new URL(`/api/routes/${routeId}`, baseUrl);

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

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to fetch route details for ${routeId}.`, response.status, errorText);
    throw new Error("Failed to fetch route details.");
  }

  return (await response.json()) as RouteDetailsDto;
}

export default async function RouteDetailsPage({ params }: RouteDetailsPageProps) {
  const resolvedParams = await params;
  const routeId = resolvedParams.routeId;
  if (!routeId) {
    notFound();
  }

  const route = await fetchRouteDetails(routeId);

  return <RouteDetailsView route={route} />;
}
