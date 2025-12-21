"use client";

import type { AuthValidationMessages } from "@/features/auth/validation";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export function useLocaleAwarePath() {
  const params = useParams();
  const localeParam = params?.locale;
  const locale = Array.isArray(localeParam) ? localeParam[0] : localeParam;

  return (path: string) => (locale ? `/${locale}${path}` : path);
}

export function useAuthValidationMessages(): AuthValidationMessages {
  const validation = useTranslations("auth.validation");

  return useMemo(
    () => ({
      email: {
        required: validation("email.required"),
        invalid: validation("email.invalid"),
      },
      password: {
        required: validation("password.required"),
        minLength: validation("password.minLength"),
        weak: validation("password.weak"),
      },
      confirmPassword: {
        required: validation("confirmPassword.required"),
        mismatch: validation("confirmPassword.mismatch"),
      },
    }),
    [validation]
  );
}
