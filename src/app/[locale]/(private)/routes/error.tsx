"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

interface RoutesErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RoutesError({ error, reset }: RoutesErrorProps) {
  const t = useTranslations("routes.error");

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Routes view error:", error);
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border border-border bg-card px-6 py-12 text-center text-card-foreground shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="max-w-lg text-sm text-muted-foreground">{t("description")}</p>
        {error.digest ? <p className="text-xs text-muted-foreground/80">Ref: {error.digest}</p> : null}
      </div>
      <Button onClick={reset}>{t("retry")}</Button>
    </div>
  );
}
