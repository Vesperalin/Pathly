"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormErrorMessage } from "@/features/auth/components/FormMessage";
import { useAuthValidationMessages, useLocaleAwarePath } from "@/features/auth/components/useAuthFormHelpers";
import { createRegisterSchema, type RegisterFormValues } from "@/features/auth/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

interface RegisterFormProps {
  onSubmit?: (values: RegisterFormValues) => Promise<ActionResult | never>;
}

const noop = async (): Promise<ActionResult> => ({ success: true });

export function RegisterForm({ onSubmit = noop }: RegisterFormProps) {
  const t = useTranslations("auth.register");
  const validationMessages = useAuthValidationMessages();
  const scopedPath = useLocaleAwarePath();
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const schema = useMemo(() => createRegisterSchema(validationMessages), [validationMessages]);

  const form = useForm<RegisterFormValues>({
    // @ts-expect-error - zodResolver type inference issue with superRefine
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });

  const {
    formState: { errors, isSubmitting },
  } = form;

  const handleSubmit = form.handleSubmit(async (values: RegisterFormValues) => {
    setFormError(null);
    setIsLoading(true);

    try {
      const result = await onSubmit(values);

      // Handle ActionResult from Server Action
      // Note: successful registration will redirect, so this code only runs on error
      if (!result.success) {
        // Handle field-specific errors
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, message]) => {
            form.setError(field as keyof RegisterFormValues, {
              type: "manual",
              message,
            });
          });
        }

        // Handle general error with translation
        if (result.error) {
          // Check if translation key exists, otherwise use generic
          const translationKey = `errors.${result.error}`;
          const errorMessage = t.has(translationKey) ? t(translationKey as "errors.generic") : t("errors.generic");
          setFormError(errorMessage);
        }
      }
    } catch (error) {
      // Handle unexpected errors (network, etc.)
      const fallbackMessage = t("errors.generic");
      const message = error instanceof Error && error.message ? error.message : fallbackMessage;
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  });

  const loading = isSubmitting || isLoading;

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <FormErrorMessage message={formError} />

      <div className="space-y-2">
        <Label htmlFor="register-email">{t("form.fields.email.label")}</Label>
        <Input
          id="register-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("form.fields.email.placeholder")}
          disabled={loading}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "register-email-error" : undefined}
          {...form.register("email")}
        />
        <FieldError id="register-email-error" message={errors.email?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">{t("form.fields.password.label")}</Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          placeholder={t("form.fields.password.placeholder")}
          disabled={loading}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "register-password-error" : undefined}
          {...form.register("password")}
        />
        <FieldError id="register-password-error" message={errors.password?.message} />
        <p className="text-xs text-muted-foreground">{t("helper.passwordHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirm-password">{t("form.fields.confirmPassword.label")}</Label>
        <Input
          id="register-confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder={t("form.fields.confirmPassword.placeholder")}
          disabled={loading}
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={errors.confirmPassword ? "register-confirm-password-error" : undefined}
          {...form.register("confirmPassword")}
        />
        <FieldError id="register-confirm-password-error" message={errors.confirmPassword?.message} />
      </div>

      <Button type="submit" disabled={loading} aria-busy={loading} className="w-full">
        {loading ? t("form.actions.submitting") : t("form.actions.submit")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("form.actions.switchPrefix")}{" "}
        <Link href={scopedPath("/login")} className="font-medium text-primary hover:underline">
          {t("form.actions.switchCta")}
        </Link>
      </p>
    </form>
  );
}
