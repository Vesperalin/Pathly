import CatalogDetailsView from "@/app/[locale]/(private)/catalogs/[catalogId]/_components/CatalogDetailsView";
import type { CatalogDetailsDto } from "@/types";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";

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

async function fetchCatalogDetails(catalogId: string): Promise<CatalogDetailsDto | null> {
  const baseUrl = await resolveBaseUrl();
  const url = new URL(`/api/catalogs/${catalogId}`, baseUrl);
  url.searchParams.set("routes_page", "1");

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      console.error(`Failed to fetch catalog ${catalogId}.`, response.statusText);
      throw new Error(`Failed to fetch catalog ${catalogId}.`);
    }

    return (await response.json()) as CatalogDetailsDto;
  } catch (error) {
    console.error(`Failed to fetch catalog ${catalogId}.`, error);
    throw error;
  }
}

interface CatalogDetailsPageProps {
  params: {
    catalogId: string;
  };
}

export default async function CatalogDetailsPage({ params }: CatalogDetailsPageProps) {
  const catalog = await fetchCatalogDetails(params.catalogId);

  if (!catalog) {
    notFound();
  }

  return <CatalogDetailsView initialData={catalog} />;
}
