import { useContext } from "react";

import { BreadcrumbsContext } from "@/components/layout/BreadcrumbsContext";

export function useBreadcrumbs() {
  const context = useContext(BreadcrumbsContext);

  if (!context) {
    throw new Error("useBreadcrumbs must be used within a BreadcrumbsProvider");
  }

  return context;
}
