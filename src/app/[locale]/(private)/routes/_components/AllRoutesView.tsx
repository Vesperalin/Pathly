"use client";

import { BreadcrumbsSetter } from "@/components/layout/BreadcrumbsContext";
import { Button } from "@/components/ui/button";
import type { PaginatedRoutesDto } from "@/types";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { PaginationControls } from "./PaginationControls";
import { RoutesList } from "./RoutesList";
import { RoutesToolbar } from "./RoutesToolbar";

interface AllRoutesViewProps {
  initialData: PaginatedRoutesDto;
  searchParams: Record<string, string | undefined>;
}

type SortByValue = "name" | "route_date";
type SortOrderValue = "asc" | "desc";

interface SortOptionConfig {
  value: string;
  sortBy: SortByValue;
  order: SortOrderValue;
  labelKey: string;
}

const SORT_OPTION_CONFIGS: SortOptionConfig[] = [
  { value: "route_date:desc", sortBy: "route_date", order: "desc", labelKey: "toolbar.sort.options.dateDesc" },
  { value: "route_date:asc", sortBy: "route_date", order: "asc", labelKey: "toolbar.sort.options.dateAsc" },
  { value: "name:asc", sortBy: "name", order: "asc", labelKey: "toolbar.sort.options.nameAsc" },
  { value: "name:desc", sortBy: "name", order: "desc", labelKey: "toolbar.sort.options.nameDesc" },
];

export default function AllRoutesView({ initialData, searchParams }: AllRoutesViewProps) {
  const t = useTranslations("routes");
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();
  const params = useParams<{ locale?: string }>();
  const [isPending, startTransition] = useTransition();

  const localeParam = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
  const localePrefix = localeParam ? `/${localeParam}` : "";

  const [searchValue, setSearchValue] = useState(searchParams.search ?? "");

  useEffect(() => {
    setSearchValue(searchParams.search ?? "");
  }, [searchParams.search]);

  const sortOptions = useMemo(
    () =>
      SORT_OPTION_CONFIGS.map((config) => ({
        value: config.value,
        sortBy: config.sortBy,
        order: config.order,
        label: t(config.labelKey),
      })),
    [t]
  );

  const currentSortKey = useMemo(() => {
    const sortBy = (searchParams.sort_by as SortByValue | undefined) ?? "route_date";
    const order = (searchParams.order as SortOrderValue | undefined) ?? "desc";
    return `${sortBy}:${order}`;
  }, [searchParams.order, searchParams.sort_by]);

  const activeSortOption = useMemo(() => {
    return sortOptions.find((option) => option.value === currentSortKey) ?? sortOptions[0];
  }, [currentSortKey, sortOptions]);

  const pagination = initialData.pagination;
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.page_size));
  const createRouteHref = `${localePrefix}/routes/new`;

  const commitQueryUpdates = useCallback(
    (updates: Record<string, string | undefined>) => {
      const nextParams = new URLSearchParams(currentSearchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          nextParams.delete(key);
          return;
        }

        if (key === "page" && value === "1") {
          nextParams.delete(key);
          return;
        }

        nextParams.set(key, value);
      });

      const nextQuery = nextParams.toString();
      const target = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.push(target, { scroll: false });
    },
    [currentSearchParams, pathname, router]
  );

  useEffect(() => {
    const normalizedInput = searchValue.trim();
    const normalizedQuery = (searchParams.search ?? "").trim();

    if (normalizedInput === normalizedQuery) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      startTransition(() => {
        commitQueryUpdates({
          search: normalizedInput.length > 0 ? normalizedInput : undefined,
          page: "1",
        });
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [commitQueryUpdates, searchParams.search, searchValue, startTransition]);

  const handleSortChange = useCallback(
    (value: string) => {
      const nextOption = sortOptions.find((option) => option.value === value);
      if (!nextOption) {
        return;
      }

      startTransition(() => {
        commitQueryUpdates({
          sort_by: nextOption.sortBy,
          order: nextOption.order,
          page: "1",
        });
      });
    },
    [commitQueryUpdates, sortOptions, startTransition]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      startTransition(() => {
        commitQueryUpdates({
          page: page <= 1 ? undefined : String(page),
        });
      });
    },
    [commitQueryUpdates, startTransition]
  );

  const handleRouteSelect = useCallback(
    (routeId: string) => {
      router.push(`${localePrefix}/routes/${routeId}`);
    },
    [localePrefix, router]
  );

  const breadcrumbItems = useMemo(
    () => [{ label: t("breadcrumbs.home"), href: `${localePrefix}/routes` }, { label: t("breadcrumbs.list") }],
    [localePrefix, t]
  );

  return (
    <div className="flex flex-col gap-6">
      <BreadcrumbsSetter items={breadcrumbItems} />

      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button asChild>
          <Link href={createRouteHref}>{t("header.cta")}</Link>
        </Button>
      </header>

      <RoutesToolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder={t("toolbar.search.placeholder")}
        isPending={isPending}
        sortLabel={t("toolbar.sort.label")}
        sortOptions={sortOptions}
        selectedSort={activeSortOption.value}
        onSortChange={handleSortChange}
        activeSortLabel={activeSortOption.label}
      />

      <RoutesList
        routes={initialData.data}
        isLoading={isPending && initialData.data.length === 0}
        isPending={isPending && initialData.data.length > 0}
        labels={{
          columns: {
            name: t("list.columns.name"),
            date: t("list.columns.date"),
            distance: t("list.columns.distance"),
            points: t("list.columns.points"),
          },
          empty: {
            title: t("list.empty.title"),
            description: t("list.empty.description"),
            cta: t("list.empty.cta"),
          },
        }}
        onRouteSelect={handleRouteSelect}
        addRouteHref={createRouteHref}
        refreshingLabel={t("list.refreshing")}
      />

      <PaginationControls
        currentPage={pagination.page}
        totalPages={totalPages}
        previousLabel={t("pagination.previous")}
        nextLabel={t("pagination.next")}
        pageLabel={t("pagination.pageOf", { page: pagination.page, totalPages })}
        onPageChange={handlePageChange}
        isPending={isPending}
      />
    </div>
  );
}
