"use client";

import { FileUploader } from "@/app/[locale]/(private)/routes/new/_components/FileUploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CatalogPreviewDto, GpxParseResultDto, MountainGroupDto } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TranslationValues } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import {
  type Resolver,
  useForm,
  type UseFormClearErrors,
  type UseFormReset,
  type UseFormSetError,
} from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const DURATION_REGEX = /^\d{2}:\d{2}$/;
export const ROUTE_FORM_MAX_SELECTED_CATALOGS = 5;
export const ROUTE_FORM_MAX_SELECTED_MOUNTAIN_GROUPS = 5;

export interface RouteFormValues {
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

export interface RouteFormSubmitPayload {
  name: string;
  route_date: string;
  distance: number;
  total_ascent: number;
  total_descent: number;
  duration: number;
  got_points?: number;
  notes?: string;
  mountain_group_ids?: string[];
  catalog_ids?: string[];
}

export interface RouteFormSubmitHelpers {
  setFieldError: UseFormSetError<RouteFormValues>;
  clearFormErrors: UseFormClearErrors<RouteFormValues>;
  resetForm: UseFormReset<RouteFormValues>;
}

interface FieldCopy {
  label: string;
  placeholder: string;
}

export interface RouteFormTexts {
  sections: {
    file: {
      title: string;
      description: string;
    };
    gpxData: {
      title: string;
      description: string;
      summary: {
        title: string;
        empty: string;
      };
      actions: {
        clear: string;
      };
    };
    manualData: {
      title: string;
      description: string;
    };
    associations: {
      title: string;
      description: string;
    };
  };
  units: {
    kilometer: string;
    meter: string;
  };
  form: {
    fields: {
      name: FieldCopy;
      route_date: FieldCopy;
      distance: FieldCopy;
      total_ascent: FieldCopy;
      total_descent: FieldCopy;
      duration: FieldCopy;
      got_points: FieldCopy;
      notes: FieldCopy;
      mountain_group_ids: FieldCopy;
      catalog_ids: FieldCopy & { predefinedLabel: string };
    };
    actions: {
      submit: string;
      submitting: string;
    };
  };
  fileUploader: {
    description: string;
    hint: string;
    buttonIdle: string;
    buttonParsing: string;
    error: {
      multiple: string;
    };
  };
  validation: {
    name: {
      required: string;
      minLength: string;
      maxLength: string;
    };
    route_date: {
      required: string;
    };
    distance: {
      required: string;
      nonNegative: string;
    };
    total_ascent: {
      required: string;
      nonNegative: string;
    };
    total_descent: {
      required: string;
      nonNegative: string;
    };
    duration: {
      required: string;
      format: string;
    };
    got_points: {
      nonNegative: string;
      requiredForPredefined: string;
    };
    mountain_group_ids: {
      max: string;
    };
    catalog_ids: {
      max: string;
    };
  };
  errors: {
    conflict: string;
    validation: string;
  };
  toast: {
    success: string;
    parseSuccess: string;
    parseError: string;
    unknownError: string;
  };
}

type TranslateFn = (key: string, values?: TranslationValues) => string;

export interface RouteFormTextsOverrides {
  formActions?: RouteFormTexts["form"]["actions"];
  toast?: Partial<RouteFormTexts["toast"]>;
}

export function buildRouteFormTexts(translate: TranslateFn, overrides?: RouteFormTextsOverrides): RouteFormTexts {
  const base: RouteFormTexts = {
    sections: {
      file: {
        title: translate("sections.file.title"),
        description: translate("sections.file.description"),
      },
      gpxData: {
        title: translate("sections.gpxData.title"),
        description: translate("sections.gpxData.description"),
        summary: {
          title: translate("sections.gpxData.summary.title"),
          empty: translate("sections.gpxData.summary.empty"),
        },
        actions: {
          clear: translate("sections.gpxData.actions.clear"),
        },
      },
      manualData: {
        title: translate("sections.manualData.title"),
        description: translate("sections.manualData.description"),
      },
      associations: {
        title: translate("sections.associations.title"),
        description: translate("sections.associations.description"),
      },
    },
    units: {
      kilometer: translate("units.kilometer"),
      meter: translate("units.meter"),
    },
    form: {
      fields: {
        name: {
          label: translate("form.fields.name.label"),
          placeholder: translate("form.fields.name.placeholder"),
        },
        route_date: {
          label: translate("form.fields.route_date.label"),
          placeholder: translate("form.fields.route_date.placeholder"),
        },
        distance: {
          label: translate("form.fields.distance.label"),
          placeholder: translate("form.fields.distance.placeholder"),
        },
        total_ascent: {
          label: translate("form.fields.total_ascent.label"),
          placeholder: translate("form.fields.total_ascent.placeholder"),
        },
        total_descent: {
          label: translate("form.fields.total_descent.label"),
          placeholder: translate("form.fields.total_descent.placeholder"),
        },
        duration: {
          label: translate("form.fields.duration.label"),
          placeholder: translate("form.fields.duration.placeholder"),
        },
        got_points: {
          label: translate("form.fields.got_points.label"),
          placeholder: translate("form.fields.got_points.placeholder"),
        },
        notes: {
          label: translate("form.fields.notes.label"),
          placeholder: translate("form.fields.notes.placeholder"),
        },
        mountain_group_ids: {
          label: translate("form.fields.mountain_group_ids.label"),
          placeholder: translate("form.fields.mountain_group_ids.placeholder"),
        },
        catalog_ids: {
          label: translate("form.fields.catalog_ids.label"),
          placeholder: translate("form.fields.catalog_ids.placeholder"),
          predefinedLabel: translate("form.fields.catalog_ids.predefinedLabel"),
        },
      },
      actions: {
        submit: translate("form.actions.submit"),
        submitting: translate("form.actions.submitting"),
      },
    },
    fileUploader: {
      description: translate("fileUploader.description"),
      hint: translate("fileUploader.hint"),
      buttonIdle: translate("fileUploader.buttonIdle"),
      buttonParsing: translate("fileUploader.buttonParsing"),
      error: {
        multiple: translate("fileUploader.error.multiple"),
      },
    },
    validation: {
      name: {
        required: translate("validation.name.required"),
        minLength: translate("validation.name.minLength"),
        maxLength: translate("validation.name.maxLength"),
      },
      route_date: {
        required: translate("validation.route_date.required"),
      },
      distance: {
        required: translate("validation.distance.required"),
        nonNegative: translate("validation.distance.nonNegative"),
      },
      total_ascent: {
        required: translate("validation.total_ascent.required"),
        nonNegative: translate("validation.total_ascent.nonNegative"),
      },
      total_descent: {
        required: translate("validation.total_descent.required"),
        nonNegative: translate("validation.total_descent.nonNegative"),
      },
      duration: {
        required: translate("validation.duration.required"),
        format: translate("validation.duration.format"),
      },
      got_points: {
        nonNegative: translate("validation.got_points.nonNegative"),
        requiredForPredefined: translate("validation.got_points.requiredForPredefined"),
      },
      mountain_group_ids: {
        max: translate("validation.mountain_group_ids.max", {
          limit: ROUTE_FORM_MAX_SELECTED_MOUNTAIN_GROUPS,
        }),
      },
      catalog_ids: {
        max: translate("validation.catalog_ids.max", {
          limit: ROUTE_FORM_MAX_SELECTED_CATALOGS,
        }),
      },
    },
    errors: {
      conflict: translate("errors.conflict"),
      validation: translate("errors.validation"),
    },
    toast: {
      success: translate("toast.success"),
      parseSuccess: translate("toast.parseSuccess"),
      parseError: translate("toast.parseError"),
      unknownError: translate("toast.unknownError"),
    },
  };

  if (overrides?.formActions) {
    base.form.actions = overrides.formActions;
  }

  if (overrides?.toast) {
    base.toast = {
      ...base.toast,
      ...overrides.toast,
    };
  }

  return base;
}

interface RouteFormProps {
  catalogs: CatalogPreviewDto[];
  mountainGroups: MountainGroupDto[];
  texts: RouteFormTexts;
  onSubmit: (payload: RouteFormSubmitPayload, helpers: RouteFormSubmitHelpers) => Promise<void>;
  onParseGpx?: (files: File[]) => Promise<GpxParseResultDto>;
  defaultValues?: Partial<RouteFormValues>;
  showFileUpload?: boolean;
  maxCatalogSelections?: number;
  maxMountainGroupSelections?: number;
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

const createRequiredNumberField = (messages: { required: string; nonNegative: string }) =>
  z
    .string()
    .trim()
    .min(1, { message: messages.required })
    .refine(
      (value) => {
        const parsed = Number(value.replace(",", "."));
        return !Number.isNaN(parsed);
      },
      { message: messages.nonNegative }
    )
    .refine((value) => Number(value.replace(",", ".")) >= 0, {
      message: messages.nonNegative,
    });

const createOptionalNumberField = (messages: { nonNegative: string }) =>
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
      { message: messages.nonNegative }
    );

function getRouteFormSchema(
  validation: RouteFormTexts["validation"],
  predefinedCatalogIds: Set<string>,
  maxSelections: { catalogs: number; mountainGroups: number }
) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { message: validation.name.required })
        .min(3, { message: validation.name.minLength })
        .max(255, { message: validation.name.maxLength }),
      route_date: z
        .string()
        .trim()
        .min(1, { message: validation.route_date.required })
        .refine((value) => !Number.isNaN(Date.parse(value)), {
          message: validation.route_date.required,
        }),
      distance: createRequiredNumberField(validation.distance),
      total_ascent: createRequiredNumberField(validation.total_ascent),
      total_descent: createRequiredNumberField(validation.total_descent),
      duration: z
        .string()
        .trim()
        .min(1, { message: validation.duration.required })
        .refine((value) => DURATION_REGEX.test(value), {
          message: validation.duration.format,
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
            message: validation.duration.format,
          }
        ),
      got_points: createOptionalNumberField(validation.got_points),
      notes: z.string().trim().optional(),
      mountain_group_ids: z
        .array(z.string())
        .max(maxSelections.mountainGroups, {
          message: validation.mountain_group_ids.max,
        })
        .default([]),
      catalog_ids: z
        .array(z.string())
        .max(maxSelections.catalogs, {
          message: validation.catalog_ids.max,
        })
        .default([]),
    })
    .superRefine((values, ctx) => {
      const hasPredefinedCatalogSelected = values.catalog_ids.some((catalogId) => predefinedCatalogIds.has(catalogId));
      if (hasPredefinedCatalogSelected && !values.got_points) {
        ctx.addIssue({
          path: ["got_points"],
          code: z.ZodIssueCode.custom,
          message: validation.got_points.requiredForPredefined,
        });
      }
    });
}

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

export default function RouteForm({
  catalogs,
  mountainGroups,
  texts,
  onSubmit,
  onParseGpx,
  defaultValues,
  showFileUpload = true,
  maxCatalogSelections = ROUTE_FORM_MAX_SELECTED_CATALOGS,
  maxMountainGroupSelections = ROUTE_FORM_MAX_SELECTED_MOUNTAIN_GROUPS,
}: RouteFormProps) {
  const [isParsingGpx, setIsParsingGpx] = useState(false);

  const predefinedCatalogIds = useMemo(
    () => new Set(catalogs.filter((catalog) => catalog.is_predefined).map((catalog) => catalog.id)),
    [catalogs]
  );

  const validationSchema = useMemo(
    () =>
      getRouteFormSchema(texts.validation, predefinedCatalogIds, {
        catalogs: maxCatalogSelections,
        mountainGroups: maxMountainGroupSelections,
      }),
    [maxCatalogSelections, maxMountainGroupSelections, predefinedCatalogIds, texts.validation]
  );

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(validationSchema) as Resolver<RouteFormValues>,
    defaultValues: {
      name: defaultValues?.name ?? "",
      route_date: defaultValues?.route_date ?? "",
      distance: defaultValues?.distance ?? "",
      total_ascent: defaultValues?.total_ascent ?? "",
      total_descent: defaultValues?.total_descent ?? "",
      duration: defaultValues?.duration ?? "",
      got_points: defaultValues?.got_points ?? "",
      notes: defaultValues?.notes ?? "",
      mountain_group_ids: defaultValues?.mountain_group_ids ?? [],
      catalog_ids: defaultValues?.catalog_ids ?? [],
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
        label: texts.form.fields.distance.label,
        value: distanceValue ? `${distanceValue} ${texts.units.kilometer}` : "—",
      },
      {
        id: "total-ascent",
        label: texts.form.fields.total_ascent.label,
        value: totalAscentValue ? `${totalAscentValue} ${texts.units.meter}` : "—",
      },
      {
        id: "total-descent",
        label: texts.form.fields.total_descent.label,
        value: totalDescentValue ? `${totalDescentValue} ${texts.units.meter}` : "—",
      },
      {
        id: "duration",
        label: texts.form.fields.duration.label,
        value: durationValue || "—",
      },
    ],
    [distanceValue, durationValue, texts, totalAscentValue, totalDescentValue]
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

      if (current.length >= maxCatalogSelections) {
        toast.error(texts.validation.catalog_ids.max);
        return;
      }

      form.setValue("catalog_ids", [...current, catalogId], { shouldDirty: true, shouldValidate: true });
      form.clearErrors("catalog_ids");
    },
    [form, maxCatalogSelections, texts.validation.catalog_ids.max]
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

      if (current.length >= maxMountainGroupSelections) {
        toast.error(texts.validation.mountain_group_ids.max);
        return;
      }

      form.setValue("mountain_group_ids", [...current, groupId], { shouldDirty: true, shouldValidate: true });
      form.clearErrors("mountain_group_ids");
    },
    [form, maxMountainGroupSelections, texts.validation.mountain_group_ids.max]
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
      if (!onParseGpx) {
        return;
      }

      if (!files.length) {
        return;
      }

      setIsParsingGpx(true);

      try {
        const result = await onParseGpx(files);
        applyGpxResult(result);
        toast.success(texts.toast.parseSuccess);
      } catch (error) {
        console.error("Failed to parse GPX file", error);
        const message = error instanceof Error && error.message ? error.message : texts.toast.parseError;
        toast.error(message);
      } finally {
        setIsParsingGpx(false);
      }
    },
    [applyGpxResult, onParseGpx, texts.toast.parseError, texts.toast.parseSuccess]
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    form.clearErrors();

    const distanceKilometers = sanitizeNumberInput(values.distance);
    const totalAscent = sanitizeIntegerInput(values.total_ascent);
    const totalDescent = sanitizeIntegerInput(values.total_descent);

    const payload: RouteFormSubmitPayload = {
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

    try {
      await onSubmit(payload, {
        setFieldError: form.setError,
        clearFormErrors: form.clearErrors,
        resetForm: form.reset,
      });
    } catch (error) {
      console.error("Failed to submit route form", error);
      const message = error instanceof Error && error.message ? error.message : texts.toast.unknownError;
      toast.error(message);
    }
  });

  const notesFieldId = "route-notes";

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {showFileUpload && onParseGpx ? (
        <Card>
          <CardHeader>
            <CardTitle>{texts.sections.file.title}</CardTitle>
            <CardDescription>{texts.sections.file.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader
              isParsing={isParsingGpx || isSubmitting}
              onFilesSelected={handleFilesSelected}
              texts={{
                description: texts.fileUploader.description,
                hint: texts.fileUploader.hint,
                buttonIdle: texts.fileUploader.buttonIdle,
                buttonParsing: texts.fileUploader.buttonParsing,
                error: {
                  multiple: texts.fileUploader.error.multiple,
                },
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{texts.sections.gpxData.title}</CardTitle>
          <CardDescription>{texts.sections.gpxData.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{texts.sections.gpxData.summary.title}</p>
              {!hasGpxValues ? (
                <p className="text-xs text-muted-foreground">{texts.sections.gpxData.summary.empty}</p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearGpxValues}
              disabled={!hasGpxValues || isParsingGpx || isSubmitting}
            >
              {texts.sections.gpxData.actions.clear}
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
              <Label htmlFor="distance">{texts.form.fields.distance.label}</Label>
              <Input
                id="distance"
                inputMode="decimal"
                placeholder={texts.form.fields.distance.placeholder}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.distance)}
                aria-describedby={errors.distance ? "distance-error" : undefined}
                {...form.register("distance")}
              />
              <FieldError id="distance-error" message={errors.distance?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_ascent">{texts.form.fields.total_ascent.label}</Label>
              <Input
                id="total_ascent"
                inputMode="numeric"
                placeholder={texts.form.fields.total_ascent.placeholder}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.total_ascent)}
                aria-describedby={errors.total_ascent ? "total-ascent-error" : undefined}
                {...form.register("total_ascent")}
              />
              <FieldError id="total-ascent-error" message={errors.total_ascent?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_descent">{texts.form.fields.total_descent.label}</Label>
              <Input
                id="total_descent"
                inputMode="numeric"
                placeholder={texts.form.fields.total_descent.placeholder}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.total_descent)}
                aria-describedby={errors.total_descent ? "total-descent-error" : undefined}
                {...form.register("total_descent")}
              />
              <FieldError id="total-descent-error" message={errors.total_descent?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">{texts.form.fields.duration.label}</Label>
              <Input
                id="duration"
                placeholder={texts.form.fields.duration.placeholder}
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
          <CardTitle>{texts.sections.manualData.title}</CardTitle>
          <CardDescription>{texts.sections.manualData.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="route-name">{texts.form.fields.name.label}</Label>
              <Input
                id="route-name"
                placeholder={texts.form.fields.name.placeholder}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                {...form.register("name")}
              />
              <FieldError id="name-error" message={errors.name?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="route-date">{texts.form.fields.route_date.label}</Label>
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
              <Label htmlFor="got-points">{texts.form.fields.got_points.label}</Label>
              <Input
                id="got-points"
                inputMode="numeric"
                placeholder={texts.form.fields.got_points.placeholder}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.got_points)}
                aria-describedby={errors.got_points ? "got-points-error" : undefined}
                {...form.register("got_points")}
              />
              <FieldError id="got-points-error" message={errors.got_points?.message} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={notesFieldId}>{texts.form.fields.notes.label}</Label>
              <textarea
                id={notesFieldId}
                rows={4}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.notes)}
                aria-describedby={errors.notes ? "notes-error" : undefined}
                className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={texts.form.fields.notes.placeholder}
                {...form.register("notes")}
              />
              <FieldError id="notes-error" message={errors.notes?.message} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{texts.sections.associations.title}</CardTitle>
          <CardDescription>{texts.sections.associations.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{texts.form.fields.catalog_ids.label}</Label>
              <p className="text-xs text-muted-foreground">{texts.form.fields.catalog_ids.placeholder}</p>
            </div>
            {catalogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">{texts.form.fields.catalog_ids.placeholder}</p>
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
                          {texts.form.fields.catalog_ids.predefinedLabel}
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
              <Label>{texts.form.fields.mountain_group_ids.label}</Label>
              <p className="text-xs text-muted-foreground">{texts.form.fields.mountain_group_ids.placeholder}</p>
            </div>
            {mountainGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">{texts.form.fields.mountain_group_ids.placeholder}</p>
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
          {isSubmitting ? texts.form.actions.submitting : texts.form.actions.submit}
        </Button>
      </div>
    </form>
  );
}
