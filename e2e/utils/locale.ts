export function getLocale(): string {
  return process.env.E2E_LOCALE ?? "pl";
}

export function getLocalePrefix(): string {
  const locale = getLocale();
  return locale ? `/${locale}` : "";
}
