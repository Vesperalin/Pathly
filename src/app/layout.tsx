import { ThemeProvider } from "@/components/theme-provider";
import { FALLBACK_LOCALE, isSupportedLocale } from "@/lib/i18n/locales";
import "@/styles/globals.css";
import type { ReactNode } from "react";

interface RootLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale?: string;
  }>;
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale: localeParam } = await params;
  const locale = isSupportedLocale(localeParam) ? localeParam : FALLBACK_LOCALE;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
