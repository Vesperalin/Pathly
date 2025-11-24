import type { ReactNode } from "react";

import { BreadcrumbsProvider } from "@/components/layout/BreadcrumbsContext";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/toaster";

interface PrivateLayoutProps {
  children: ReactNode;
}

export default function PrivateLayout({ children }: PrivateLayoutProps) {
  return (
    <BreadcrumbsProvider>
      <div className="relative flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <MobileHeader />
          <main className="flex-1 px-4 py-6 md:px-8 lg:px-10">{children}</main>
        </div>
        <Toaster />
      </div>
    </BreadcrumbsProvider>
  );
}
