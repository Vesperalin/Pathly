import { Logo } from "@/components/layout/Logo";
import { Toaster } from "@/components/ui/toaster";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

interface PublicLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default async function PublicLayout({ children, params }: PublicLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.layout" });
  const currentYear = new Date().getFullYear();
  const supportEmail = t("support.email");

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/40">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-3 text-center">
            <Logo />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">{t("eyebrow")}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("title")}</h1>
              <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>

          {children}

          <div className="space-y-2 text-center text-xs text-muted-foreground">
            <p>
              {t("support.label")}{" "}
              <a href={`mailto:${supportEmail}`} className="font-medium text-primary hover:underline">
                {supportEmail}
              </a>
            </p>
            <p>{t("footer", { year: currentYear })}</p>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
