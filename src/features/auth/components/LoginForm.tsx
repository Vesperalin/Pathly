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

interface LoginFormProps {
  onSubmit?: (values: LoginFormValues) => Promise<void> | void;
}

const noop = async () => {};

export function LoginForm({ onSubmit = noop }: LoginFormProps) {
  const t = useTranslations("auth.login");
  const validationMessages = useAuthValidationMessages();
  const scopedPath = useLocaleAwarePath();
  const [formError, setFormError] = useState<string | null>(null);

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
    try {
      await onSubmit(values);
    } catch (error) {
      const fallbackMessage = t("errors.generic");
      const message = error instanceof Error && error.message ? error.message : fallbackMessage;
      setFormError(message);
    }
  });

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <FormErrorMessage message={formError} />

      <div className="space-y-2">
        <Label htmlFor="login-email">{t("form.fields.email.label")}</Label>
        <Input
          id="login-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("form.fields.email.placeholder")}
          disabled={isSubmitting}
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
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "login-password-error" : undefined}
          {...form.register("password")}
        />
        <FieldError id="login-password-error" message={errors.password?.message} />
      </div>

      <div className="flex flex-col gap-4">
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="w-full">
          {isSubmitting ? t("form.actions.submitting") : t("form.actions.submit")}
        </Button>
        <div className="text-center text-sm">
          <Link href={scopedPath("/forgot-password")} className="font-medium text-primary hover:underline">
            {t("form.actions.forgotPassword")}
          </Link>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {t("form.actions.switchPrefix")}{" "}
        <Link href={scopedPath("/register")} className="font-medium text-primary hover:underline">
          {t("form.actions.switchCta")}
        </Link>
      </p>
    </form>
  );
}
