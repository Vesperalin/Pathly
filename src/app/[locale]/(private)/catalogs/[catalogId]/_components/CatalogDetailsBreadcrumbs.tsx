"use client";

import { BreadcrumbsSetter } from "@/components/layout/BreadcrumbsContext";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useMemo } from "react";

interface CatalogDetailsBreadcrumbsProps {
  catalogName: string;
}

export function CatalogDetailsBreadcrumbs({ catalogName }: CatalogDetailsBreadcrumbsProps) {
  const translation = useTranslations("catalogs.breadcrumbs");
  const params = useParams<{ locale?: string }>();

  const localePrefix = useMemo(() => {
    const localeParam = params?.locale;
    const detected = Array.isArray(localeParam) ? localeParam[0] : localeParam;
    return detected ? `/${detected}` : "";
  }, [params]);

  return (
    <BreadcrumbsSetter
      items={[{ label: translation("catalogs"), href: `${localePrefix}/catalogs` }, { label: catalogName }]}
    />
  );
}
