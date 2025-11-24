"use client";

import Link from "next/link";
import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsContextValue {
  items: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
}

interface BreadcrumbsProviderProps {
  children: ReactNode;
}

interface BreadcrumbsSetterProps {
  items: BreadcrumbItem[];
  resetOnUnmount?: boolean;
}

export const BreadcrumbsContext = createContext<BreadcrumbsContextValue | undefined>(undefined);

export function BreadcrumbsProvider({ children }: BreadcrumbsProviderProps) {
  const [items, setItems] = useState<BreadcrumbItem[]>([]);

  const value = useMemo<BreadcrumbsContextValue>(
    () => ({
      items,
      setBreadcrumbs: setItems,
    }),
    [items]
  );

  return <BreadcrumbsContext.Provider value={value}>{children}</BreadcrumbsContext.Provider>;
}

export function Breadcrumbs() {
  const context = useBreadcrumbs();

  if (!context || context.items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {context.items.map((item, index) => {
        const isLast = index === context.items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1">
            {item.href && !isLast ? (
              <Link href={item.href} className="text-muted-foreground hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-semibold text-foreground" : "text-muted-foreground"}>{item.label}</span>
            )}
            {!isLast && <span className="text-muted-foreground">/</span>}
          </span>
        );
      })}
    </nav>
  );
}

export function BreadcrumbsSetter({ items, resetOnUnmount = true }: BreadcrumbsSetterProps) {
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs(items);

    if (!resetOnUnmount) {
      return;
    }

    return () => {
      setBreadcrumbs([]);
    };
  }, [items, resetOnUnmount, setBreadcrumbs]);

  return null;
}
