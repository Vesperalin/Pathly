"use client";

import { BreadcrumbsSetter } from "@/components/layout/BreadcrumbsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { patchProfile } from "@/features/profiles/profile.api";
import { useProfile } from "@/hooks/useProfile";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/i18n/locales";
import type { Language, ProfileDto, Theme, UpdateProfileCommand } from "@/types";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { LanguageSwitcher } from "./_components/LanguageSwitcher";
import { ThemeSwitcher } from "./_components/ThemeSwitcher";

interface SettingsViewProps {
  initialProfile: ProfileDto;
}

type UpdatingField = "language" | "theme" | null;

interface UpdateOptions {
  field: Exclude<UpdatingField, null>;
  successMessage: string;
  errorMessage: string;
  onSuccess?: (updated: ProfileDto, previous: ProfileDto) => void;
  optimisticEffect?: (next: ProfileDto, previous: ProfileDto) => void;
  rollbackEffect?: (previous: ProfileDto) => void;
}

export default function SettingsView({ initialProfile }: SettingsViewProps) {
  const translation = useTranslations("settings");
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setTheme } = useTheme();

  const [updatingField, setUpdatingField] = useState<UpdatingField>(null);

  const { profile, error, mutate } = useProfile(initialProfile);

  const currentLocale = useMemo<SupportedLocale>(() => {
    const localeParam = params?.locale;
    const locale = Array.isArray(localeParam) ? localeParam[0] : localeParam;
    if (locale && SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
      return locale as SupportedLocale;
    }
    return SUPPORTED_LOCALES[0];
  }, [params]);

  const isUpdatingLanguage = updatingField === "language";
  const isUpdatingTheme = updatingField === "theme";

  const headerSection = (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">{translation("title")}</h1>
      <p className="text-muted-foreground">{translation("description")}</p>
    </section>
  );

  const navigateToLocale = useCallback(
    (nextLocale: Language) => {
      if (!pathname) {
        return;
      }

      document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

      const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
      const localePattern = new RegExp(`^/(?:${SUPPORTED_LOCALES.join("|")})(?=/|$)`, "i");
      const pathWithoutLocale = normalizedPath.replace(localePattern, "") || "/";

      const search = searchParams?.toString();
      const nextPath = pathWithoutLocale.startsWith("/") ? pathWithoutLocale : `/${pathWithoutLocale}`;
      const nextUrl = `/${nextLocale}${nextPath === "/" ? "" : nextPath}`;
      const target = search ? `${nextUrl}?${search}` : nextUrl;

      if (typeof window !== "undefined") {
        window.location.assign(target);
        return;
      }

      router.replace(target);
      router.refresh();
    },
    [pathname, router, searchParams]
  );

  const handleRetry = useCallback(() => {
    void mutate();
  }, [mutate]);

  const updateProfile = useCallback(
    async (command: UpdateProfileCommand, options: UpdateOptions) => {
      if (!profile) {
        return;
      }

      const previousProfile = profile;
      const optimisticData = {
        ...profile,
        ...command,
      } as ProfileDto;

      setUpdatingField(options.field);

      try {
        options.optimisticEffect?.(optimisticData, previousProfile);

        const updatedProfile = await mutate(async () => patchProfile(command), {
          optimisticData,
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        });

        toast.success(options.successMessage);

        if (updatedProfile) {
          options.onSuccess?.(updatedProfile, previousProfile);
        }
      } catch (error) {
        console.error("Failed to update profile:", error);
        options.rollbackEffect?.(previousProfile);
        toast.error(options.errorMessage);
        toast.info(translation("toast.revert"));
      } finally {
        setUpdatingField(null);
      }
    },
    [profile, mutate, translation]
  );

  const handleLanguageChange = useCallback(
    async (language: Language) => {
      if (!profile || language === profile.language) {
        return;
      }

      await updateProfile(
        { language },
        {
          field: "language",
          successMessage: translation("personalization.language.toast.success"),
          errorMessage: translation("personalization.language.toast.error"),
          onSuccess: () => {
            navigateToLocale(language);
          },
        }
      );
    },
    [navigateToLocale, profile, translation, updateProfile]
  );

  const handleThemeChange = useCallback(
    async (theme: Theme) => {
      if (!profile || theme === profile.theme) {
        return;
      }

      await updateProfile(
        { theme },
        {
          field: "theme",
          successMessage: translation("personalization.theme.toast.success"),
          errorMessage: translation("personalization.theme.toast.error"),
          optimisticEffect: (nextProfile) => {
            setTheme(nextProfile.theme);
          },
          rollbackEffect: (previousProfile) => {
            setTheme(previousProfile.theme);
          },
          onSuccess: (updated) => {
            setTheme(updated.theme);
          },
        }
      );
    },
    [profile, setTheme, translation, updateProfile]
  );

  if (error && !profile) {
    return (
      <div className="flex flex-col gap-6">
        <BreadcrumbsSetter items={[{ label: translation("breadcrumbs.home") }]} />
        {headerSection}
        <Card>
          <CardHeader>
            <CardTitle>{translation("status.error.title")}</CardTitle>
            <CardDescription>{translation("status.error.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRetry}>{translation("status.error.retry")}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-6">
        <BreadcrumbsSetter items={[{ label: translation("breadcrumbs.home") }]} />
        {headerSection}
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">{translation("status.loading")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const languageValue = profile?.language ?? currentLocale;
  const themeValue = profile?.theme ?? "system";

  return (
    <div className="flex flex-col gap-6">
      <BreadcrumbsSetter items={[{ label: translation("breadcrumbs.home") }]} />
      {headerSection}

      <Card>
        <CardHeader>
          <CardTitle>{translation("personalization.title")}</CardTitle>
          <CardDescription>{translation("personalization.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LanguageSwitcher
            currentValue={languageValue}
            disabled={isUpdatingLanguage}
            onSelect={handleLanguageChange}
          />
          <ThemeSwitcher currentValue={themeValue} disabled={isUpdatingTheme} onSelect={handleThemeChange} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{translation("security.title")}</CardTitle>
          <CardDescription>{translation("security.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{translation("security.placeholder")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
