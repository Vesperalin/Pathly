import type { ReactNode } from "react";

import { BreadcrumbsProvider } from "@/components/layout/BreadcrumbsContext";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { logoutAction } from "@/features/auth/actions";

interface PrivateLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default async function PrivateLayout({ children, params }: PrivateLayoutProps) {
  const { locale } = await params;

  // Bind locale to logoutAction
  const logoutWithLocale = logoutAction.bind(null, locale);

  return (
    <BreadcrumbsProvider>
      <div className="relative flex min-h-screen bg-background text-foreground">
        <Sidebar onLogout={logoutWithLocale} />
        <div className="flex flex-1 flex-col">
          <MobileHeader onLogout={logoutWithLocale} />
          <main className="flex-1 px-4 py-6 md:px-8 lg:px-10">{children}</main>
        </div>
        <Toaster />
      </div>
    </BreadcrumbsProvider>
  );
}
