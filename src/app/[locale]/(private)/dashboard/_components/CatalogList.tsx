"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CatalogPreviewDto } from "@/types";
import { MoreVertical } from "lucide-react";
import { useFormatter, useLocale } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

interface CatalogListErrorState {
  title: string;
  description: string;
  actionLabel: string;
  onRetry?: () => void;
}

interface CatalogListEmptyState {
  title: string;
  description: string;
  actionLabel?: string;
}

interface CatalogListLabels {
  name: string;
  points: string;
  updatedAt: string;
  actionsLabel: string;
  edit: string;
  delete: string;
  refreshing: string;
}

export interface CatalogListProps {
  title: string;
  catalogs: CatalogPreviewDto[];
  isUserList: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: CatalogListErrorState | null;
  emptyState: CatalogListEmptyState;
  labels: CatalogListLabels;
  addActionLabel?: string;
  onAdd?: () => void;
  onEdit?: (catalog: CatalogPreviewDto) => void;
  onDelete?: (catalog: CatalogPreviewDto) => void;
  onRetry?: () => void;
}

export function CatalogList({
  title,
  catalogs,
  isUserList,
  isLoading,
  isRefreshing,
  error,
  emptyState,
  labels,
  addActionLabel,
  onAdd,
  onEdit,
  onDelete,
  onRetry,
}: CatalogListProps) {
  const params = useParams<{ locale?: string }>();
  const formatter = useFormatter();
  const locale = useLocale();

  const localePrefix = useMemo(() => {
    const localeParam = params?.locale;
    const detected = Array.isArray(localeParam) ? localeParam[0] : localeParam;
    return detected ? `/${detected}` : "";
  }, [params]);

  const hasCatalogs = catalogs.length > 0;
  const showEmptyState = !isLoading && !error && !hasCatalogs;

  if (error) {
    const retry = error.onRetry ?? onRetry;
    return (
      <Card>
        <CardHeader className="gap-4">
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{error.description}</p>
          {retry ? (
            <div>
              <Button variant="outline" onClick={retry}>
                {error.actionLabel}
              </Button>
            </div>
          ) : null}
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle>{title}</CardTitle>
          {isRefreshing ? <p className="text-xs text-muted-foreground">{labels.refreshing}</p> : null}
        </div>
        {isUserList && onAdd && addActionLabel ? (
          <Button onClick={onAdd} size="sm">
            {addActionLabel}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <LoadingState withActions={isUserList} />
        ) : showEmptyState ? (
          <EmptyState
            title={emptyState.title}
            description={emptyState.description}
            onAdd={onAdd}
            actionLabel={emptyState.actionLabel}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{labels.name}</TableHead>
                <TableHead className="w-32 text-right">{labels.points}</TableHead>
                <TableHead className="w-40 text-right">{labels.updatedAt}</TableHead>
                {isUserList ? <TableHead className="w-20 text-right">{labels.actionsLabel}</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalogs.map((catalog) => {
                const href = `${localePrefix}/catalogs/${catalog.id}`;
                const points = catalog.total_points ?? 0;
                const updatedAt = formatUpdatedAt(formatter, catalog.updated_at);
                const relativeUpdatedAt = formatRelativeUpdatedAt(catalog.updated_at, locale);

                return (
                  <TableRow key={catalog.id}>
                    <TableCell>
                      <Link href={href} className="font-medium text-primary underline-offset-4 hover:underline">
                        {catalog.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-medium">{points}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      <span title={updatedAt}>{relativeUpdatedAt}</span>
                    </TableCell>
                    {isUserList ? (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={labels.actionsLabel}>
                              <MoreVertical className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => onEdit?.(catalog)}>{labels.edit}</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onDelete?.(catalog)}>{labels.delete}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAdd?: () => void;
}

function EmptyState({ title, description, actionLabel, onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-border bg-muted/30 p-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAdd ? (
        <Button onClick={onAdd} size="sm">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

function LoadingState({ withActions }: { withActions: boolean }) {
  return (
    <div className="space-y-4 pt-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="ml-auto h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          {withActions ? <Skeleton className="h-8 w-10" /> : null}
        </div>
      ))}
    </div>
  );
}

function formatUpdatedAt(formatter: ReturnType<typeof useFormatter>, value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return formatter.dateTime(date, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatRelativeUpdatedAt(value: string | null, locale: string) {
  if (!value) {
    return "—";
  }

  const target = new Date(value);
  if (Number.isNaN(target.getTime())) {
    return "—";
  }

  const diffMs = target.getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["week", 1000 * 60 * 60 * 24 * 7],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
    ["second", 1000],
  ];

  for (const [unit, unitMs] of units) {
    if (Math.abs(diffMs) >= unitMs || unit === "second") {
      const valueInUnit = Math.round(diffMs / unitMs);
      return formatter.format(valueInUnit, unit);
    }
  }

  return formatter.format(0, "second");
}
