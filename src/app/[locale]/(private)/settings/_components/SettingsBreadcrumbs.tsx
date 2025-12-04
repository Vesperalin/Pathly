"use client";

import { BreadcrumbsSetter } from "@/components/layout/BreadcrumbsContext";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export function SettingsBreadcrumbs() {
  const translation = useTranslations("settings");

  const items = useMemo(
    () => [
      {
        label: translation("breadcrumbs.home"),
      },
    ],
    [translation]
  );

  return <BreadcrumbsSetter items={items} />;
}
