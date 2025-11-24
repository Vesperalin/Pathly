import { useBreadcrumbs } from "./useBreadcrumbs";

export function useBreadcrumbSetter() {
  const { setBreadcrumbs } = useBreadcrumbs();
  return setBreadcrumbs;
}
