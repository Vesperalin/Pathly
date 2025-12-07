"use client";

import { FileUploader } from "@/app/[locale]/(private)/routes/new/_components/FileUploader";
import { BreadcrumbsSetter } from "@/components/layout/BreadcrumbsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CatalogPreviewDto, GpxParseResultDto, MountainGroupDto, RouteDetailsDto } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const DURATION_REGEX = /^\d{2}:\d{2}$/;
const MAX_SELECTED_CATALOGS = 5;
const MAX_SELECTED_MOUNTAIN_GROUPS = 5;

type Translator = ReturnType<typeof useTranslations>;

interface AddRouteFormValues {
  name: string;
  route_date: string;
  distance: string;
  total_ascent: string;
  total_descent: string;
  duration: string;
  got_points: string;
  notes: string;
  mountain_group_ids: string[];
  catalog_ids: string[];
}

function sanitizeNumberInput(value: string): number {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sanitizeIntegerInput(value: string): number {
  return Math.round(sanitizeNumberInput(value));
}

function formatKilometerInput(raw: number | null | undefined): string {
  if (typeof raw !== "number" || Number.isNaN(raw) || raw <= 0) {
    return "";
  }

  const normalized = raw >= 1000 ? raw / 1000 : raw > 100 ? raw / 1000 : raw;
  const fractionDigits = normalized < 10 ? 2 : 1;

  return normalized
    .toFixed(fractionDigits)
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/\.0+$/, "");
}

function formatMetricInput(raw: number | null | undefined): string {
  if (typeof raw !== "number" || Number.isNaN(raw) || raw <= 0) {
    return "";
  }

  return Math.round(raw).toString();
}

function secondsToDurationString(seconds: number | null | undefined): string {
  if (typeof seconds !== "number" || Number.isNaN(seconds) || seconds <= 0) {
    return "";
  }

  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function durationStringToSeconds(value: string): number {
  const [hoursStr, minutesStr] = value.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  return hours * 3600 + minutes * 60;
}

const createRequiredNumberField = (t: Translator, path: string) =>
  z
    .string()
    .trim()
    .min(1, { message: t(`validation.${path}.required`) })
    .refine(
      (value) => {
        const parsed = Number(value.replace(",", "."));
        return !Number.isNaN(parsed);
      },
      { message: t(`validation.${path}.nonNegative`) }
    )
    .refine((value) => Number(value.replace(",", ".")) >= 0, {
      message: t(`validation.${path}.nonNegative`),
    });

const createOptionalNumberField = (t: Translator, path: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) => {
        if (!value) {
          return true;
        }
        const parsed = Number(value.replace(",", "."));
        return !Number.isNaN(parsed) && parsed >= 0;
      },
      { message: t(`validation.${path}.nonNegative`) }
    );

const getAddRouteSchema = (t: Translator, predefinedCatalogIds: Set<string>) =>
  z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { message: t("validation.name.required") })
        .min(3, { message: t("validation.name.minLength") })
        .max(255, { message: t("validation.name.maxLength") }),
      route_date: z
        .string()
        .trim()
        .min(1, { message: t("validation.route_date.required") })
        .refine((value) => !Number.isNaN(Date.parse(value)), {
          message: t("validation.route_date.required"),
        }),
      distance: createRequiredNumberField(t, "distance"),
      total_ascent: createRequiredNumberField(t, "total_ascent"),
      total_descent: createRequiredNumberField(t, "total_descent"),
      duration: z
        .string()
        .trim()
        .min(1, { message: t("validation.duration.required") })
        .refine((value) => DURATION_REGEX.test(value), {
          message: t("validation.duration.format"),
        })
        .refine(
          (value) => {
            const [hours, minutes] = value.split(":").map((part) => Number(part));
            if (Number.isNaN(hours) || Number.isNaN(minutes)) {
              return false;
            }
            return minutes >= 0 && minutes < 60;
          },
          {
            message: t("validation.duration.format"),
          }
        ),
      got_points: createOptionalNumberField(t, "got_points"),
      notes: z.string().trim().optional(),
      mountain_group_ids: z
        .array(z.string())
        .max(MAX_SELECTED_MOUNTAIN_GROUPS, {
          message: t("validation.mountain_group_ids.max", { limit: MAX_SELECTED_MOUNTAIN_GROUPS }),
        })
        .default([]),
      catalog_ids: z
        .array(z.string())
        .max(MAX_SELECTED_CATALOGS, {
          message: t("validation.catalog_ids.max", { limit: MAX_SELECTED_CATALOGS }),
        })
        .default([]),
    })
    .superRefine((values, ctx) => {
      const hasPredefinedCatalogSelected = values.catalog_ids.some((catalogId) => predefinedCatalogIds.has(catalogId));
      if (hasPredefinedCatalogSelected && !values.got_points) {
        ctx.addIssue({
          path: ["got_points"],
          code: z.ZodIssueCode.custom,
          message: t("validation.got_points.requiredForPredefined"),
        });
      }
    });

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

export interface AddRouteViewProps {
  catalogs: CatalogPreviewDto[];
  mountainGroups: MountainGroupDto[];
}

function AddRouteBreadcrumbs() {
  const t = useTranslations("routes.create.breadcrumbs");

  return <BreadcrumbsSetter items={[{ label: t("list"), href: "/routes" }, { label: t("new") }]} />;
}

export default function AddRouteView({ catalogs, mountainGroups }: AddRouteViewProps) {
  const t = useTranslations("routes.create");
  const locale = useLocale();
  const router = useRouter();
  const [isParsingGpx, setIsParsingGpx] = useState(false);

  const predefinedCatalogIds = useMemo(
    () => new Set(catalogs.filter((catalog) => catalog.is_predefined).map((catalog) => catalog.id)),
    [catalogs]
  );

  const validationSchema = useMemo(() => getAddRouteSchema(t, predefinedCatalogIds), [predefinedCatalogIds, t]);

  const form = useForm<AddRouteFormValues>({
    resolver: zodResolver(validationSchema) as Resolver<AddRouteFormValues>,
    defaultValues: {
      name: "",
      route_date: "",
      distance: "",
      total_ascent: "",
      total_descent: "",
      duration: "",
      got_points: "",
      notes: "",
      mountain_group_ids: [],
      catalog_ids: [],
    },
    mode: "onSubmit",
  });

  const distanceValue = form.watch("distance");
  const totalAscentValue = form.watch("total_ascent");
  const totalDescentValue = form.watch("total_descent");
  const durationValue = form.watch("duration");
  const { errors, isSubmitting } = form.formState;
  const selectedCatalogIds = form.watch("catalog_ids");
  const selectedMountainGroupIds = form.watch("mountain_group_ids");
  const hasGpxValues = Boolean(distanceValue || totalAscentValue || totalDescentValue || durationValue);

  const gpxSummaryItems = useMemo(
    () => [
      {
        id: "distance",
        label: t("form.fields.distance.label"),
        value: distanceValue ? `${distanceValue} ${t("units.kilometer")}` : "—",
      },
      {
        id: "total-ascent",
        label: t("form.fields.total_ascent.label"),
        value: totalAscentValue ? `${totalAscentValue} ${t("units.meter")}` : "—",
      },
      {
        id: "total-descent",
        label: t("form.fields.total_descent.label"),
        value: totalDescentValue ? `${totalDescentValue} ${t("units.meter")}` : "—",
      },
      {
        id: "duration",
        label: t("form.fields.duration.label"),
        value: durationValue || "—",
      },
    ],
    [distanceValue, durationValue, t, totalAscentValue, totalDescentValue]
  );

  const clearGpxValues = useCallback(() => {
    form.setValue("distance", "", { shouldDirty: true, shouldValidate: true });
    form.setValue("total_ascent", "", { shouldDirty: true, shouldValidate: true });
    form.setValue("total_descent", "", { shouldDirty: true, shouldValidate: true });
    form.setValue("duration", "", { shouldDirty: true, shouldValidate: true });
    form.clearErrors(["distance", "total_ascent", "total_descent", "duration"]);
  }, [form]);

  const toggleCatalog = useCallback(
    (catalogId: string) => {
      const current = form.getValues("catalog_ids");
      const isSelected = current.includes(catalogId);

      if (isSelected) {
        const next = current.filter((id) => id !== catalogId);
        form.setValue("catalog_ids", next, { shouldDirty: true, shouldValidate: true });
        form.clearErrors("catalog_ids");
        return;
      }

      if (current.length >= MAX_SELECTED_CATALOGS) {
        toast.error(t("validation.catalog_ids.max", { limit: MAX_SELECTED_CATALOGS }));
        return;
      }

      form.setValue("catalog_ids", [...current, catalogId], { shouldDirty: true, shouldValidate: true });
      form.clearErrors("catalog_ids");
    },
    [form, t]
  );

  const toggleMountainGroup = useCallback(
    (groupId: string) => {
      const current = form.getValues("mountain_group_ids");
      const isSelected = current.includes(groupId);

      if (isSelected) {
        const next = current.filter((id) => id !== groupId);
        form.setValue("mountain_group_ids", next, { shouldDirty: true, shouldValidate: true });
        form.clearErrors("mountain_group_ids");
        return;
      }

      if (current.length >= MAX_SELECTED_MOUNTAIN_GROUPS) {
        toast.error(t("validation.mountain_group_ids.max", { limit: MAX_SELECTED_MOUNTAIN_GROUPS }));
        return;
      }

      form.setValue("mountain_group_ids", [...current, groupId], { shouldDirty: true, shouldValidate: true });
      form.clearErrors("mountain_group_ids");
    },
    [form, t]
  );

  const applyGpxResult = useCallback(
    (result: GpxParseResultDto) => {
      form.clearErrors(["distance", "total_ascent", "total_descent", "duration", "route_date"]);

      if (result.route_date) {
        form.setValue("route_date", result.route_date, { shouldDirty: true, shouldValidate: true });
      }

      if (typeof result.distance === "number") {
        form.setValue("distance", formatKilometerInput(result.distance), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (typeof result.total_ascent === "number") {
        form.setValue("total_ascent", formatMetricInput(result.total_ascent), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (typeof result.total_descent === "number") {
        form.setValue("total_descent", formatMetricInput(result.total_descent), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (typeof result.duration === "number") {
        const durationString = secondsToDurationString(result.duration);
        if (durationString) {
          form.setValue("duration", durationString, { shouldDirty: true, shouldValidate: true });
        }
      }
    },
    [form]
  );

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      if (!files.length) {
        return;
      }

      setIsParsingGpx(true);

      try {
        const payload = new FormData();
        files.forEach((file) => payload.append("gpxFiles", file));

        const response = await fetch("/api/routes/gpx-parse", {
          method: "POST",
          body: payload,
        });

        if (!response.ok) {
          const rawBody = await response.text().catch(() => "");
          let message: string | undefined;

          if (rawBody) {
            try {
              const parsed = JSON.parse(rawBody) as { message?: unknown; error?: unknown };
              if (typeof parsed.message === "string") {
                message = parsed.message;
              } else if (typeof parsed.error === "string") {
                message = parsed.error;
              }
            } catch {
              message = rawBody;
            }
          }

          throw new Error(message?.trim() ? message : t("toast.parseError"));
        }

        const data = (await response.json()) as GpxParseResultDto;
        applyGpxResult(data);
        toast.success(t("toast.parseSuccess"));
      } catch (error) {
        console.error("Failed to parse GPX file", error);
        const message = error instanceof Error && error.message ? error.message : t("toast.parseError");
        toast.error(message);
      } finally {
        setIsParsingGpx(false);
      }
    },
    [applyGpxResult, t]
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    form.clearErrors();

    try {
      const distanceKilometers = sanitizeNumberInput(values.distance);
      const totalAscent = sanitizeIntegerInput(values.total_ascent);
      const totalDescent = sanitizeIntegerInput(values.total_descent);

      const payload = {
        name: values.name.trim(),
        route_date: values.route_date,
        distance: Math.round(distanceKilometers * 1000),
        total_ascent: totalAscent,
        total_descent: totalDescent,
        duration: durationStringToSeconds(values.duration),
        got_points: values.got_points ? sanitizeIntegerInput(values.got_points) : undefined,
        notes: values.notes.trim() ? values.notes.trim() : undefined,
        mountain_group_ids: values.mountain_group_ids.length ? values.mountain_group_ids : undefined,
        catalog_ids: values.catalog_ids.length ? values.catalog_ids : undefined,
      };

      const response = await fetch("/api/routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 201) {
        const createdRoute = (await response.json()) as RouteDetailsDto;
        toast.success(t("toast.success"));
        const localePrefix = locale ? `/${locale}` : "";
        router.push(`${localePrefix}/routes/${createdRoute.id}`);
        return;
      }

      if (response.status === 409) {
        const body = await response.json().catch(() => null);
        const message = (body?.message as string | undefined) ?? t("errors.conflict");
        form.setError("name", { type: "server", message });
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

            if (typeof field === "string" && message && field in values) {
              form.setError(field as keyof AddRouteFormValues, { type: "server", message });
              mapped = true;
            }
          });
        }

        if (!mapped) {
          const validationMessage =
            (typeof body?.message === "string" && body.message.trim()) ||
            (typeof body?.error === "string" && body.error.trim()) ||
            t("errors.validation");
          toast.error(validationMessage);
        }

        return;
      }

      const rawBody = await response.text().catch(() => "");
      let fallbackMessage = t("toast.unknownError");

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
      console.error("Failed to submit add route form", error);
      const message = error instanceof Error && error.message ? error.message : t("toast.unknownError");
      toast.error(message);
    }
  });

  const notesFieldId = "route-notes";

  return (
    <div className="space-y-8">
      <AddRouteBreadcrumbs />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </header>

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle>{t("sections.file.title")}</CardTitle>
            <CardDescription>{t("sections.file.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader
              isParsing={isParsingGpx || isSubmitting}
              onFilesSelected={handleFilesSelected}
              texts={{
                description: t("fileUploader.description"),
                hint: t("fileUploader.hint"),
                buttonIdle: t("fileUploader.buttonIdle"),
                buttonParsing: t("fileUploader.buttonParsing"),
                error: {
                  multiple: t("fileUploader.error.multiple"),
                },
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("sections.gpxData.title")}</CardTitle>
            <CardDescription>{t("sections.gpxData.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{t("sections.gpxData.summary.title")}</p>
                {!hasGpxValues ? (
                  <p className="text-xs text-muted-foreground">{t("sections.gpxData.summary.empty")}</p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearGpxValues}
                disabled={!hasGpxValues || isParsingGpx || isSubmitting}
              >
                {t("sections.gpxData.actions.clear")}
              </Button>
            </div>
            {hasGpxValues ? (
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {gpxSummaryItems.map((item) => (
                  <div key={item.id} className="rounded-md border border-border bg-muted/40 p-3">
                    <dt className="text-xs font-medium uppercase text-muted-foreground">{item.label}</dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground">{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="distance">{t("form.fields.distance.label")}</Label>
                <Input
                  id="distance"
                  inputMode="decimal"
                  placeholder={t("form.fields.distance.placeholder")}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.distance)}
                  aria-describedby={errors.distance ? "distance-error" : undefined}
                  {...form.register("distance")}
                />
                <FieldError id="distance-error" message={errors.distance?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_ascent">{t("form.fields.total_ascent.label")}</Label>
                <Input
                  id="total_ascent"
                  inputMode="numeric"
                  placeholder={t("form.fields.total_ascent.placeholder")}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.total_ascent)}
                  aria-describedby={errors.total_ascent ? "total-ascent-error" : undefined}
                  {...form.register("total_ascent")}
                />
                <FieldError id="total-ascent-error" message={errors.total_ascent?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_descent">{t("form.fields.total_descent.label")}</Label>
                <Input
                  id="total_descent"
                  inputMode="numeric"
                  placeholder={t("form.fields.total_descent.placeholder")}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.total_descent)}
                  aria-describedby={errors.total_descent ? "total-descent-error" : undefined}
                  {...form.register("total_descent")}
                />
                <FieldError id="total-descent-error" message={errors.total_descent?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">{t("form.fields.duration.label")}</Label>
                <Input
                  id="duration"
                  placeholder={t("form.fields.duration.placeholder")}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.duration)}
                  aria-describedby={errors.duration ? "duration-error" : undefined}
                  {...form.register("duration")}
                />
                <FieldError id="duration-error" message={errors.duration?.message} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("sections.manualData.title")}</CardTitle>
            <CardDescription>{t("sections.manualData.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="route-name">{t("form.fields.name.label")}</Label>
                <Input
                  id="route-name"
                  placeholder={t("form.fields.name.placeholder")}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  {...form.register("name")}
                />
                <FieldError id="name-error" message={errors.name?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="route-date">{t("form.fields.route_date.label")}</Label>
                <Input
                  id="route-date"
                  type="date"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.route_date)}
                  aria-describedby={errors.route_date ? "route-date-error" : undefined}
                  {...form.register("route_date")}
                />
                <FieldError id="route-date-error" message={errors.route_date?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="got-points">{t("form.fields.got_points.label")}</Label>
                <Input
                  id="got-points"
                  inputMode="numeric"
                  placeholder={t("form.fields.got_points.placeholder")}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.got_points)}
                  aria-describedby={errors.got_points ? "got-points-error" : undefined}
                  {...form.register("got_points")}
                />
                <FieldError id="got-points-error" message={errors.got_points?.message} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={notesFieldId}>{t("form.fields.notes.label")}</Label>
                <textarea
                  id={notesFieldId}
                  rows={4}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.notes)}
                  aria-describedby={errors.notes ? "notes-error" : undefined}
                  className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={t("form.fields.notes.placeholder")}
                  {...form.register("notes")}
                />
                <FieldError id="notes-error" message={errors.notes?.message} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("sections.associations.title")}</CardTitle>
            <CardDescription>{t("sections.associations.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>{t("form.fields.catalog_ids.label")}</Label>
                <p className="text-xs text-muted-foreground">{t("form.fields.catalog_ids.placeholder")}</p>
              </div>
              {catalogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("form.fields.catalog_ids.placeholder")}</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {catalogs.map((catalog) => {
                    const isSelected = selectedCatalogIds.includes(catalog.id);

                    return (
                      <Button
                        key={catalog.id}
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                        aria-pressed={isSelected}
                        onClick={() => toggleCatalog(catalog.id)}
                        className={cn(
                          "h-auto w-full justify-between gap-2 whitespace-normal py-3 text-left",
                          isSelected && "border-primary bg-primary/10 text-primary"
                        )}
                      >
                        <span className="truncate">{catalog.name}</span>
                        {catalog.is_predefined ? (
                          <Badge variant={isSelected ? "default" : "secondary"} className="shrink-0">
                            {t("form.fields.catalog_ids.predefinedLabel")}
                          </Badge>
                        ) : null}
                      </Button>
                    );
                  })}
                </div>
              )}
              <FieldError id="catalog-ids-error" message={errors.catalog_ids?.message} />
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label>{t("form.fields.mountain_group_ids.label")}</Label>
                <p className="text-xs text-muted-foreground">{t("form.fields.mountain_group_ids.placeholder")}</p>
              </div>
              {mountainGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("form.fields.mountain_group_ids.placeholder")}</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {mountainGroups.map((group) => {
                    const isSelected = selectedMountainGroupIds.includes(group.id);

                    return (
                      <Button
                        key={group.id}
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                        aria-pressed={isSelected}
                        onClick={() => toggleMountainGroup(group.id)}
                        className={cn(
                          "h-auto w-full justify-between gap-2 whitespace-normal py-3 text-left",
                          isSelected && "border-primary bg-primary/10 text-primary"
                        )}
                      >
                        <span className="truncate">{group.name}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
              <FieldError id="mountain-group-ids-error" message={errors.mountain_group_ids?.message} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? t("form.actions.submitting") : t("form.actions.submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
