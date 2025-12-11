"use client";

import { BreadcrumbsSetter } from "@/components/layout/BreadcrumbsContext";
import RouteForm, {
  buildRouteFormTexts,
  type RouteFormSubmitHelpers,
  type RouteFormSubmitPayload,
  type RouteFormValues,
} from "@/features/routes/components/RouteForm";
import type { CatalogPreviewDto, GpxParseResultDto, MountainGroupDto, RouteDetailsDto } from "@/types";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

export interface AddRouteViewProps {
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

function AddRouteBreadcrumbs() {
  const t = useTranslations("routes.create.breadcrumbs");

  return <BreadcrumbsSetter items={[{ label: t("list"), href: "/routes" }, { label: t("new") }]} />;
}

export default function AddRouteView({ catalogs, mountainGroups }: AddRouteViewProps) {
  const createTranslations = useTranslations("routes.create");
  const locale = useLocale();
  const router = useRouter();
  const localePrefix = locale ? `/${locale}` : "";

  const texts = useMemo(() => buildRouteFormTexts(createTranslations), [createTranslations]);

  const handleParseGpx = useCallback(
    async (files: File[]): Promise<GpxParseResultDto> => {
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

        throw new Error(message?.trim() ? message : texts.toast.parseError);
      }

      return (await response.json()) as GpxParseResultDto;
    },
    [texts.toast.parseError]
  );

  const handleCreate = useCallback(
    async (payload: RouteFormSubmitPayload, helpers: RouteFormSubmitHelpers) => {
      try {
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
          toast.success(texts.toast.success);
          router.push(`${localePrefix}/routes/${createdRoute.id}`);
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
        console.error("Failed to submit add route form", error);
        const message = error instanceof Error && error.message ? error.message : texts.toast.unknownError;
        toast.error(message);
      }
    },
    [localePrefix, router, texts]
  );

  return (
    <div className="space-y-8">
      <AddRouteBreadcrumbs />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{createTranslations("title")}</h1>
        <p className="text-muted-foreground">{createTranslations("description")}</p>
      </header>

      <RouteForm
        catalogs={catalogs}
        mountainGroups={mountainGroups}
        texts={texts}
        onSubmit={handleCreate}
        onParseGpx={handleParseGpx}
      />
    </div>
  );
}
