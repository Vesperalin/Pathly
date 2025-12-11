"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RouteInCatalogDto } from "@/types";
import { useFormatter } from "next-intl";

interface RouteListLabels {
  headers: {
    name: string;
    date: string;
    points: string;
  };
  loading: string;
  loadMore: string;
  empty: {
    title: string;
    description: string;
  };
  error: {
    title: string;
    action: string;
  };
}

interface RouteListProps {
  routes: RouteInCatalogDto[];
  isInitialLoading: boolean;
  isFetchingNext: boolean;
  isReachingEnd: boolean;
  hasLoadMoreError: boolean;
  labels: RouteListLabels;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  onLoadMore: () => void;
  onRetry: () => void;
}

export function RouteList({
  routes,
  isInitialLoading,
  isFetchingNext,
  isReachingEnd,
  hasLoadMoreError,
  labels,
  loadMoreRef,
  onLoadMore,
  onRetry,
}: RouteListProps) {
  const formatter = useFormatter();
  const hasRoutes = routes.length > 0;

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {isInitialLoading ? (
          <LoadingState />
        ) : hasRoutes ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{labels.headers.name}</TableHead>
                <TableHead className="w-40 text-right">{labels.headers.date}</TableHead>
                <TableHead className="w-24 text-right">{labels.headers.points}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((route) => (
                <TableRow key={route.id}>
                  <TableCell className="font-medium">{route.name}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatRouteDate(route.route_date, formatter)}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatPoints(route.got_points)}</TableCell>
                </TableRow>
              ))}
              {isFetchingNext ? (
                <TableRow aria-live="polite">
                  <TableCell colSpan={3}>
                    <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <span>{labels.loading}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        ) : (
          <EmptyState title={labels.empty.title} description={labels.empty.description} />
        )}
        {!isReachingEnd ? <div ref={loadMoreRef} aria-hidden="true" className="h-1 w-full" /> : null}
      </div>

      {hasLoadMoreError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{labels.error.title}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            {labels.error.action}
          </Button>
        </div>
      ) : null}

      {!isReachingEnd ? (
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" onClick={onLoadMore} disabled={isFetchingNext}>
            {isFetchingNext ? `${labels.loadMore}…` : labels.loadMore}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-start gap-4 px-6 py-10 text-sm">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4 px-6 py-8">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="ml-auto h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

function formatRouteDate(value: string | null, formatter: ReturnType<typeof useFormatter>) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return formatter.dateTime(date, { dateStyle: "medium" });
}

function formatPoints(points: number | null | undefined) {
  if (typeof points !== "number") {
    return "—";
  }

  return points;
}
