import { ThemeProvider } from "@/components/theme-provider";
import { FALLBACK_LOCALE } from "@/lib/i18n/locales";
import "@/styles/globals.css";
import type { ReactNode } from "react";

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={FALLBACK_LOCALE} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
