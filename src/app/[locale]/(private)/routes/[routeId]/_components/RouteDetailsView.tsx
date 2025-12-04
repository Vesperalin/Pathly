"use client";

import { BreadcrumbsSetter } from "@/components/layout/BreadcrumbsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RouteDetailsDto } from "@/types";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

export interface RouteDetailsViewProps {
  route: RouteDetailsDto;
}

export default function RouteDetailsView({ route }: RouteDetailsViewProps) {
  const translations = useTranslations("routes.details");
  const baseTranslations = useTranslations("routes");
  const formatter = useFormatter();
  const router = useRouter();
  const params = useParams<{ locale?: string }>();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const localeParam = params?.locale;
  const locale = Array.isArray(localeParam) ? localeParam[0] : localeParam;
  const localePrefix = locale ? `/${locale}` : "";

  const breadcrumbItems = useMemo(
    () => [
      { label: baseTranslations("breadcrumbs.home"), href: `${localePrefix}/routes` },
      { label: baseTranslations("breadcrumbs.details") },
    ],
    [baseTranslations, localePrefix]
  );

  const editHref = `${localePrefix}/routes/${route.id}/edit`;
  const routesListHref = `${localePrefix}/routes`;

  const emptyValueLabel = translations("metadata.emptyValue");

  const metadataEntries: { label: string; value: string }[] = [
    {
      label: translations("metadata.fields.date"),
      value: formatRouteDate(route.route_date, formatter, emptyValueLabel),
    },
    {
      label: translations("metadata.fields.points"),
      value: formatPoints(route.got_points, formatter, emptyValueLabel),
    },
    {
      label: translations("metadata.fields.distance"),
      value: formatDistance(route.distance, formatter, emptyValueLabel),
    },
    {
      label: translations("metadata.fields.duration"),
      value: formatDuration(route.duration, formatter, emptyValueLabel),
    },
    {
      label: translations("metadata.fields.ascent"),
      value: formatElevation(route.total_ascent, formatter, emptyValueLabel),
    },
    {
      label: translations("metadata.fields.descent"),
      value: formatElevation(route.total_descent, formatter, emptyValueLabel),
    },
  ];

  const handleOpenDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (isDeleting) {
        return;
      }
      setIsDeleteDialogOpen(nextOpen);
    },
    [isDeleting]
  );

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/routes/${route.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast.success(translations("toast.deleteSuccess"));
      setIsDeleteDialogOpen(false);
      router.replace(routesListHref);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete route", error);
      toast.error(translations("toast.deleteError"));
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }, [route.id, router, routesListHref, translations]);

  const deleteDialogLabels = useMemo(
    () => ({
      title: translations("deleteDialog.title"),
      description: translations("deleteDialog.description"),
      cancel: translations("deleteDialog.cancel"),
      confirm: translations("deleteDialog.confirm"),
    }),
    [translations]
  );

  const hasMountainGroups = route.mountain_groups.length > 0;
  const hasCatalogs = route.catalogs.length > 0;
  const hasNotes = Boolean(route.notes && route.notes.trim().length > 0);

  return (
    <div className="flex flex-col gap-6">
      <BreadcrumbsSetter items={breadcrumbItems} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{baseTranslations("breadcrumbs.details")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{route.name}</h1>
        </div>
        <div className="flex flex-row gap-2">
          <Button asChild variant="outline">
            <Link href={editHref}>{translations("header.actions.edit")}</Link>
          </Button>
          <Button variant="destructive" onClick={handleOpenDeleteDialog}>
            {translations("header.actions.delete")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translations("metadata.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            {metadataEntries.map((entry) => (
              <div key={entry.label} className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">{entry.label}</dt>
                <dd className="text-lg font-semibold">{entry.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{translations("mountainGroups.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {hasMountainGroups ? (
              <div className="flex flex-wrap gap-2">
                {route.mountain_groups.map((group) => (
                  <Badge key={group.id} variant="secondary">
                    {group.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{translations("mountainGroups.empty")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{translations("catalogs.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {hasCatalogs ? (
              <div className="flex flex-wrap gap-2">
                {route.catalogs.map((catalog) => (
                  <Badge key={catalog.id} variant="outline">
                    {catalog.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{translations("catalogs.empty")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translations("notes.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {hasNotes ? (
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{route.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{translations("notes.empty")}</p>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirm={handleDelete}
        isPending={isDeleting}
        title={deleteDialogLabels.title}
        description={deleteDialogLabels.description}
        cancelLabel={deleteDialogLabels.cancel}
        confirmLabel={deleteDialogLabels.confirm}
      />
    </div>
  );
}

function formatRouteDate(value: string | null, formatter: ReturnType<typeof useFormatter>, emptyValue: string): string {
  if (!value) {
    return emptyValue;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return emptyValue;
  }

  return formatter.dateTime(date, { dateStyle: "long" });
}

function formatPoints(
  value: number | null | undefined,
  formatter: ReturnType<typeof useFormatter>,
  emptyValue: string
): string {
  if (typeof value !== "number") {
    return emptyValue;
  }

  return formatter.number(value);
}

function formatDistance(
  value: number | null | undefined,
  formatter: ReturnType<typeof useFormatter>,
  emptyValue: string
): string {
  if (typeof value !== "number" || value <= 0) {
    return emptyValue;
  }

  const kilometers = value / 1000;
  return formatter.number(kilometers, {
    style: "unit",
    unit: "kilometer",
    unitDisplay: "narrow",
    maximumFractionDigits: kilometers < 10 ? 2 : 1,
    minimumFractionDigits: 0,
  });
}

function formatDuration(
  value: number | null | undefined,
  formatter: ReturnType<typeof useFormatter>,
  emptyValue: string
): string {
  if (typeof value !== "number" || value <= 0) {
    return emptyValue;
  }

  const totalMinutes = Math.round(value / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(
      formatter.number(hours, {
        style: "unit",
        unit: "hour",
        unitDisplay: "short",
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      })
    );
  }

  if (minutes > 0 || parts.length === 0) {
    parts.push(
      formatter.number(minutes, {
        style: "unit",
        unit: "minute",
        unitDisplay: "short",
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      })
    );
  }

  return parts.join(" ");
}

function formatElevation(
  value: number | null | undefined,
  formatter: ReturnType<typeof useFormatter>,
  emptyValue: string
): string {
  if (typeof value !== "number" || value <= 0) {
    return emptyValue;
  }

  return formatter.number(value, {
    style: "unit",
    unit: "meter",
    unitDisplay: "short",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}
