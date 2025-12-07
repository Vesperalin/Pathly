"use client";

import { BreadcrumbsSetter } from "@/components/layout/BreadcrumbsContext";
import RouteForm, {
  buildRouteFormTexts,
  type RouteFormSubmitHelpers,
  type RouteFormSubmitPayload,
  type RouteFormValues,
} from "@/features/routes/components/RouteForm";
import type { CatalogPreviewDto, MountainGroupDto, RouteDetailsDto, UpdateRouteCommand } from "@/types";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

interface EditRouteViewProps {
  route: RouteDetailsDto;
  catalogs: CatalogPreviewDto[];
  mountainGroups: MountainGroupDto[];
}

const FORM_FIELD_KEYS: (keyof RouteFormValues)[] = [
  "name",
  "route_date",
  "distance",
  "total_ascent",
  "total_descent",
  "duration",
  "got_points",
  "notes",
  "mountain_group_ids",
  "catalog_ids",
];

function formatDateInput(value: string | null): string {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatDistanceInput(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return "";
  }

  const normalized = value >= 1000 ? value / 1000 : value > 100 ? value / 1000 : value;
  const fractionDigits = normalized < 10 ? 2 : 1;

  return normalized
    .toFixed(fractionDigits)
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/\.0+$/, "");
}

function formatMetricInput(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return "";
  }

  return Math.round(value).toString();
}

function formatDurationInput(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return "";
  }

  const totalMinutes = Math.round(value / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatPointsInput(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return "";
  }

  return value.toString();
}

export default function EditRouteView({ route, catalogs, mountainGroups }: EditRouteViewProps) {
  const createTranslations = useTranslations("routes.create");
  const editTranslations = useTranslations("routes.edit");
  const breadcrumbTranslations = useTranslations("routes.edit.breadcrumbs");
  const locale = useLocale();
  const router = useRouter();

  const localePrefix = locale ? `/${locale}` : "";
  const detailsHref = `${localePrefix}/routes/${route.id}`;

  const texts = useMemo(
    () =>
      buildRouteFormTexts(createTranslations, {
        formActions: {
          submit: editTranslations("form.actions.submit"),
          submitting: editTranslations("form.actions.submitting"),
        },
        toast: {
          success: editTranslations("toast.success"),
          unknownError: editTranslations("toast.unknownError"),
        },
      }),
    [createTranslations, editTranslations]
  );

  const breadcrumbItems = useMemo(
    () => [
      { label: breadcrumbTranslations("list"), href: `${localePrefix}/routes` },
      { label: breadcrumbTranslations("edit") },
    ],
    [breadcrumbTranslations, localePrefix]
  );

  const headerTitle = route.name
    ? editTranslations("titleWithName", { routeName: route.name })
    : editTranslations("title");
  const headerDescription = editTranslations("description");

  const defaultValues = useMemo(
    (): RouteFormValues => ({
      name: route.name ?? "",
      route_date: formatDateInput(route.route_date),
      distance: formatDistanceInput(route.distance),
      total_ascent: formatMetricInput(route.total_ascent),
      total_descent: formatMetricInput(route.total_descent),
      duration: formatDurationInput(route.duration),
      got_points: formatPointsInput(route.got_points),
      notes: route.notes ?? "",
      mountain_group_ids: route.mountain_groups.map((group) => group.id),
      catalog_ids: route.catalogs.map((catalog) => catalog.id),
    }),
    [route]
  );

  const handleUpdate = useCallback(
    async (payload: RouteFormSubmitPayload, helpers: RouteFormSubmitHelpers) => {
      const updatePayload: UpdateRouteCommand = {
        name: payload.name,
        route_date: payload.route_date,
      };

      if (payload.got_points !== undefined) {
        updatePayload.got_points = payload.got_points;
      }

      if (payload.notes !== undefined) {
        updatePayload.notes = payload.notes;
      }

      if (payload.mountain_group_ids !== undefined) {
        updatePayload.mountain_group_ids = payload.mountain_group_ids;
      }

      if (payload.catalog_ids !== undefined) {
        updatePayload.catalog_ids = payload.catalog_ids;
      }

      try {
        const response = await fetch(`/api/routes/${route.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(updatePayload),
        });

        if (response.ok) {
          toast.success(texts.toast.success);
          router.replace(detailsHref);
          router.refresh();
          return;
        }

        if (response.status === 409) {
          const body = await response.json().catch(() => null);
          const message = (body?.message as string | undefined) ?? texts.errors.conflict;
          helpers.setFieldError("name", { type: "server", message });
          toast.error(message);
          return;
        }

        if (response.status === 400) {
          const body = await response.json().catch(() => null);
          const details = body?.details;
          let mapped = false;

          if (Array.isArray(details)) {
            details.forEach((detail) => {
              if (!detail || typeof detail !== "object") {
                return;
              }

              const path = Array.isArray((detail as { path?: unknown }).path)
                ? ((detail as { path: unknown[] }).path as unknown[])
                : [];
              const message =
                typeof (detail as { message?: unknown }).message === "string"
                  ? (detail as { message: string }).message
                  : undefined;
              const field = path[0];

              if (typeof field === "string" && message && FORM_FIELD_KEYS.includes(field as keyof RouteFormValues)) {
                helpers.setFieldError(field as keyof RouteFormValues, { type: "server", message });
                mapped = true;
              }
            });
          }

          if (!mapped) {
            const validationMessage =
              (typeof body?.message === "string" && body.message.trim()) ||
              (typeof body?.error === "string" && body.error.trim()) ||
              texts.errors.validation;
            toast.error(validationMessage);
          }

          return;
        }

        const rawBody = await response.text().catch(() => "");
        let fallbackMessage = texts.toast.unknownError;

        if (rawBody) {
          try {
            const parsed = JSON.parse(rawBody) as { message?: unknown; error?: unknown };
            if (typeof parsed.message === "string" && parsed.message.trim()) {
              fallbackMessage = parsed.message.trim();
            } else if (typeof parsed.error === "string" && parsed.error.trim()) {
              fallbackMessage = parsed.error.trim();
            } else if (rawBody.trim()) {
              fallbackMessage = rawBody.trim();
            }
          } catch {
            if (rawBody.trim()) {
              fallbackMessage = rawBody.trim();
            }
          }
        }

        toast.error(fallbackMessage);
      } catch (error) {
        console.error("Failed to submit edit route form", error);
        const message = error instanceof Error && error.message ? error.message : texts.toast.unknownError;
        toast.error(message);
      }
    },
    [
      detailsHref,
      route.id,
      router,
      texts.errors.conflict,
      texts.errors.validation,
      texts.toast.success,
      texts.toast.unknownError,
    ]
  );

  return (
    <div className="space-y-8">
      <BreadcrumbsSetter items={breadcrumbItems} />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{headerTitle}</h1>
        <p className="text-muted-foreground">{headerDescription}</p>
      </header>

      <RouteForm
        catalogs={catalogs}
        mountainGroups={mountainGroups}
        texts={texts}
        defaultValues={defaultValues}
        onSubmit={handleUpdate}
        showFileUpload={false}
      />
    </div>
  );
}
