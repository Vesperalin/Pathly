export const SUPPORTED_LOCALES = ["en", "pl"] as const;
export const FALLBACK_LOCALE = "en" as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(locale?: string | null): locale is SupportedLocale {
  if (!locale) {
    return false;
  }

  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

export function matchSupportedLocale(languageTag: string) {
  const normalized = languageTag.toLowerCase();

  for (const locale of SUPPORTED_LOCALES) {
    if (normalized === locale || normalized.startsWith(`${locale}-`)) {
      return locale;
    }
  }

  return null;
}
