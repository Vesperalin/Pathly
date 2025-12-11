# Breadcrumbs Usage Guide

This guide explains how to populate the breadcrumb trail rendered inside the mobile header (and any future breadcrumb surfaces) when building new views inside the `(private)` layout shell.

## 1. Set breadcrumbs inside a client component

Use the `BreadcrumbsSetter` helper to declaratively provide the breadcrumb items for a given route. The helper automatically clears the crumbs when the component unmounts.

```tsx
"use client";

import { BreadcrumbsSetter } from "@/components/layout/BreadcrumbsContext";
import { useTranslations } from "next-intl";

export function DashboardBreadcrumbs() {
  const t = useTranslations("dashboard.breadcrumbs");

  return (
    <BreadcrumbsSetter
      items={[
        { label: t("home"), href: "/dashboard" },
        { label: t("overview") },
      ]}
    />
  );
}
```

Mount this component near the top of your page (or layout segment) so the breadcrumbs are registered as soon as the view renders.

## 2. Imperative updates (optional)

For dynamic flows (e.g. dependent on fetched data), grab the setter and call it whenever the breadcrumb list should change.

```tsx
const setBreadcrumbs = useBreadcrumbSetter();

useEffect(() => {
  if (!route) {
    return;
  }

  setBreadcrumbs([
    { label: t("routes"), href: "/routes" },
    { label: route.name },
  ]);
}, [route, setBreadcrumbs, t]);
```

Remember to reset the breadcrumbs on unmount if you do **not** use the declarative helper:

```tsx
return () => setBreadcrumbs([]);
```

## 3. Internationalisation

Always source breadcrumb labels from your route’s message bundle so the copy matches the active locale. The mobile header already consumes the global layout namespace for button labels and falls back to the logo when no breadcrumbs are registered.

## 4. Desktop rendering

Breadcrumbs currently render only inside the mobile header. We can easily reuse the same `Breadcrumbs` component in future desktop surfaces (e.g. page headers) without altering individual views—just mount the component where desired.


