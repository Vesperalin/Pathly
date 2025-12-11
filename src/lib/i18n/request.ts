import { getRequestConfig } from "next-intl/server";

const FALLBACK_LOCALE = "en";

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale ?? FALLBACK_LOCALE;

  try {
    const messages = (await import(`../../messages/${resolvedLocale}/index.ts`)).default;
    return {
      locale: resolvedLocale,
      messages,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`Missing messages for locale "${resolvedLocale}", falling back to "${FALLBACK_LOCALE}".`, error);
    }

    const fallbackMessages = (await import(`../../messages/${FALLBACK_LOCALE}/index.ts`)).default;
    return {
      locale: FALLBACK_LOCALE,
      messages: fallbackMessages,
    };
  }
});
