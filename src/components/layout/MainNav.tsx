"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

interface MainNavProps {
  onNavigate?: () => void;
}

const NAV_ITEMS = [
  { href: "/dashboard", translationKey: "dashboard" },
  { href: "/routes", translationKey: "routes" },
  { href: "/settings", translationKey: "settings" },
];

export function MainNav({ onNavigate }: MainNavProps) {
  const pathname = usePathname();
  const params = useParams();
  const localeParam = params?.locale;
  const locale = Array.isArray(localeParam) ? localeParam[0] : localeParam;
  const prefix = locale ? `/${locale}` : "";
  const translation = useTranslations("layout.nav");

  return (
    <nav aria-label={translation("ariaLabel")} className="grid gap-1">
      {NAV_ITEMS.map((item) => {
        const resolvedHref = `${prefix}${item.href}`;
        const isActive = pathname === resolvedHref || pathname.startsWith(`${resolvedHref}/`);

        return (
          <Link
            key={item.href}
            href={resolvedHref || item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
            onClick={onNavigate}
            data-active={isActive ? "true" : "false"}
          >
            <span>{translation(item.translationKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
