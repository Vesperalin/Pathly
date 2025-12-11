"use client";

import { BreadcrumbsSetter } from "@/components/layout/BreadcrumbsContext";
import { useTranslations } from "next-intl";

export function DashboardBreadcrumbs() {
  const translation = useTranslations("dashboard.breadcrumbs");

  return (
    <BreadcrumbsSetter
      items={[{ label: translation("home"), href: "/dashboard" }, { label: translation("overview") }]}
    />
  );
}
