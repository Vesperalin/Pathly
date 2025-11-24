"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";

export function Logo() {
  const params = useParams();
  const localeParam = params?.locale;
  const locale = Array.isArray(localeParam) ? localeParam[0] : localeParam;
  const href = locale ? `/${locale}/dashboard` : "/dashboard";
  const translation = useTranslations("layout.logo");

  return (
    <Link href={href} className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
        P
      </span>
      <span>{translation("name")}</span>
    </Link>
  );
}
