import { FALLBACK_LOCALE, isSupportedLocale, matchSupportedLocale } from "@/lib/i18n/locales";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

type CookieStore = Awaited<ReturnType<typeof cookies>>;
type HeaderStore = Awaited<ReturnType<typeof headers>>;

interface LanguageCandidate {
  tag: string;
  quality: number;
}

async function resolveLocale() {
  const cookieStore: CookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  if (isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  const headerStore: HeaderStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");
  if (acceptLanguage) {
    const candidates = acceptLanguage
      .split(",")
      .map((raw: string): LanguageCandidate => {
        const [tag, ...params] = raw.trim().split(";");
        const qParam = params.find((param: string) => param.trim().startsWith("q="));
        const quality = qParam ? Number.parseFloat(qParam.split("=")[1] ?? "1") : 1;
        return { tag, quality: Number.isNaN(quality) ? 0 : quality };
      })
      .filter(({ tag }: LanguageCandidate) => Boolean(tag))
      .sort((a: LanguageCandidate, b: LanguageCandidate) => b.quality - a.quality);

    for (const candidate of candidates) {
      const supported = matchSupportedLocale(candidate.tag);
      if (supported) {
        return supported;
      }
    }
  }

  return FALLBACK_LOCALE;
}

export default async function IndexPage() {
  const locale = await resolveLocale();
  redirect(`/${locale}/dashboard`);
}
