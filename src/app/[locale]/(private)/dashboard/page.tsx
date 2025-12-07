import { DashboardBreadcrumbs } from "@/app/[locale]/(private)/dashboard/_components/DashboardBreadcrumbs";
import DashboardContent from "@/app/[locale]/(private)/dashboard/_components/DashboardContent";
import { DashboardHeader } from "@/app/[locale]/(private)/dashboard/_components/DashboardHeader";
import type { CatalogPreviewDto, PaginatedCatalogsDto } from "@/types";
import { getTranslations } from "next-intl/server";
import { cookies, headers } from "next/headers";

type CatalogType = "predefined" | "user";

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

interface FetchCatalogsResult {
  catalogs: CatalogPreviewDto[];
  error: boolean;
}

async function fetchCatalogs(type: CatalogType): Promise<FetchCatalogsResult> {
  const baseUrl = await resolveBaseUrl();
  const url = new URL("/api/catalogs", baseUrl);
  url.searchParams.set("type", type);

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

    if (!response.ok) {
      console.error(`Failed to fetch ${type} catalogs.`, response.statusText);
      return { catalogs: [], error: true };
    }

    const payload = (await response.json()) as PaginatedCatalogsDto;
    return { catalogs: payload?.data ?? [], error: false };
  } catch (error) {
    console.error(`Failed to fetch ${type} catalogs.`, error);
    return { catalogs: [], error: true };
  }
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const translation = await getTranslations("dashboard");
  const localePrefix = locale ? `/${locale}` : "";
  const createRouteHref = localePrefix ? `${localePrefix}/routes/new` : "/routes/new";

  const [predefinedResult, userResult] = await Promise.all([fetchCatalogs("predefined"), fetchCatalogs("user")]);

  return (
    <div className="flex flex-col gap-6">
      <DashboardBreadcrumbs />
      <DashboardHeader
        title={translation("title")}
        description={translation("description")}
        ctaLabel={translation("header.cta")}
        ctaHref={createRouteHref}
      />
      <DashboardContent
        initialPredefinedCatalogs={predefinedResult.catalogs}
        initialUserCatalogs={userResult.catalogs}
        predefinedError={predefinedResult.error}
        userError={userResult.error}
      />
    </div>
  );
}
