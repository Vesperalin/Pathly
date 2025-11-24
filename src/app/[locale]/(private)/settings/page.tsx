"use client";

import { BreadcrumbsSetter } from "@/components/layout/BreadcrumbsContext";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const translation = useTranslations("settings");

  return (
    <div className="flex flex-col gap-6">
      <BreadcrumbsSetter items={[{ label: translation("breadcrumbs.home") }]} />
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{translation("title")}</h1>
        <p className="text-muted-foreground">{translation("description")}</p>
      </section>
      <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-sm text-muted-foreground">{translation("comingSoon")}</p>
      </div>
    </div>
  );
}
