"use client";

import { BreadcrumbsSetter } from "@/components/layout/BreadcrumbsContext";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function DashboardPage() {
  const translation = useTranslations("dashboard");
  const params = useParams<{ locale?: string }>();
  const localeParam = params?.locale;
  const locale = Array.isArray(localeParam) ? localeParam[0] : localeParam;
  const prefix = locale ? `/${locale}` : "";

  return (
    <div className="flex flex-col gap-6">
      <BreadcrumbsSetter
        items={[
          { label: translation("breadcrumbs.home"), href: `${prefix}/dashboard` },
          { label: translation("breadcrumbs.overview") },
        ]}
      />
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
