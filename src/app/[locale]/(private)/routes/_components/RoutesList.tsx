"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RoutePreviewDto } from "@/types";
import { Loader2 } from "lucide-react";
import { useFormatter } from "next-intl";
import Link from "next/link";

interface RoutesListLabels {
  columns: {
    name: string;
    date: string;
    distance: string;
    points: string;
  };
  empty: {
    title: string;
    description: string;
    cta: string;
  };
}

interface RoutesListProps {
  routes: RoutePreviewDto[];
  isLoading: boolean;
  isPending: boolean;
  labels: RoutesListLabels;
  onRouteSelect: (routeId: string) => void;
  addRouteHref: string;
  refreshingLabel: string;
}

export function RoutesList({
  routes,
  isLoading,
  isPending,
  labels,
  onRouteSelect,
  addRouteHref,
  refreshingLabel,
}: RoutesListProps) {
  const formatter = useFormatter();
  const hasRoutes = routes.length > 0;

  return (
    <section className="relative overflow-hidden rounded-lg border border-border bg-card">
      {isLoading ? (
        <LoadingState />
      ) : hasRoutes ? (
        <>
          <Table aria-busy={isPending}>
            <TableHeader>
              <TableRow>
                <TableHead>{labels.columns.name}</TableHead>
                <TableHead className="w-32 text-right">{labels.columns.date}</TableHead>
                <TableHead className="w-32 text-right">{labels.columns.distance}</TableHead>
                <TableHead className="w-24 text-right">{labels.columns.points}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((route) => (
                <TableRow
                  key={route.id}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer transition-colors hover:bg-muted/60 focus-visible:bg-muted/80"
                  onClick={() => onRouteSelect(route.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRouteSelect(route.id);
                    }
                  }}
                >
                  <TableCell className="font-medium">{route.name}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatRouteDate(route.route_date, formatter)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatDistance(route.distance, formatter)}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatPoints(route.got_points)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {isPending ? (
            <div className="pointer-events-none absolute inset-0 flex items-start justify-end bg-background/40 p-4 backdrop-blur-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>{refreshingLabel}</span>
              </span>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState labels={labels.empty} addRouteHref={addRouteHref} />
      )}
    </section>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4 px-6 py-8">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="ml-auto h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ labels, addRouteHref }: { labels: RoutesListLabels["empty"]; addRouteHref: string }) {
  return (
    <div className="flex flex-col gap-4 px-6 py-12">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{labels.title}</h2>
        <p className="text-sm text-muted-foreground">{labels.description}</p>
      </div>
      <div>
        <Button asChild>
          <Link href={addRouteHref}>{labels.cta}</Link>
        </Button>
      </div>
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

function formatDistance(distance: number | null | undefined, formatter: ReturnType<typeof useFormatter>) {
  if (typeof distance !== "number") {
    return "—";
  }

  return formatter.number(distance, {
    style: "unit",
    unit: "kilometer",
    unitDisplay: "narrow",
    maximumFractionDigits: distance < 10 ? 2 : 1,
    minimumFractionDigits: 0,
  });
}

function formatPoints(points: number | null | undefined) {
  if (typeof points !== "number") {
    return "—";
  }

  return points;
}
