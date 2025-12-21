"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormErrorMessage } from "@/features/auth/components/FormMessage";
import { useAuthValidationMessages, useLocaleAwarePath } from "@/features/auth/components/useAuthFormHelpers";
import { createLoginSchema, type LoginFormValues } from "@/features/auth/validation";
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

interface LoginFormProps {
  onSubmit?: (values: LoginFormValues) => Promise<ActionResult | never>;
}

const noop = async (): Promise<ActionResult> => ({ success: true });

export function LoginForm({ onSubmit = noop }: LoginFormProps) {
  const t = useTranslations("auth.login");
  const validationMessages = useAuthValidationMessages();
  const scopedPath = useLocaleAwarePath();
  const [formError, setFormError] = useState<string | null>(null);
  const [showCreateAccountPrompt, setShowCreateAccountPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const schema = useMemo(() => createLoginSchema(validationMessages), [validationMessages]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const {
    formState: { errors, isSubmitting },
  } = form;

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    setShowCreateAccountPrompt(false);
    setIsLoading(true);

    try {
      const result = await onSubmit(values);

      // Handle ActionResult from Server Action
      // Note: successful login will redirect, so this code only runs on error
      if (!result.success) {
        // Handle field-specific errors
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, message]) => {
            form.setError(field as keyof LoginFormValues, {
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

          // Show create account prompt on any login error (improves UX and follows industry standard)
          setShowCreateAccountPrompt(true);
        }
      }
    } catch (error) {
      // Next.js redirect() throws a special error - let it propagate
      if (error && typeof error === "object" && "digest" in error) {
        const digest = (error as { digest?: string }).digest;
        if (digest?.startsWith("NEXT_REDIRECT")) {
          throw error;
        }
      }

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

      {showCreateAccountPrompt && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="mb-2 text-sm font-medium text-foreground">{t("helper.noAccountYet")}</p>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={scopedPath("/register")}>{t("helper.createAccountCta")}</Link>
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="login-email">{t("form.fields.email.label")}</Label>
        <Input
          id="login-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("form.fields.email.placeholder")}
          disabled={loading}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          {...form.register("email")}
        />
        <FieldError id="login-email-error" message={errors.email?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">{t("form.fields.password.label")}</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder={t("form.fields.password.placeholder")}
          disabled={loading}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "login-password-error" : undefined}
          {...form.register("password")}
        />
        <FieldError id="login-password-error" message={errors.password?.message} />
      </div>

      <Button type="submit" disabled={loading} aria-busy={loading} className="w-full">
        {loading ? t("form.actions.submitting") : t("form.actions.submit")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("form.actions.switchPrefix")}{" "}
        <Link href={scopedPath("/register")} className="font-medium text-primary hover:underline">
          {t("form.actions.switchCta")}
        </Link>
      </p>
    </form>
  );
}
