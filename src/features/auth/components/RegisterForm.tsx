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

interface RegisterFormProps {
  onSubmit?: (values: RegisterFormValues) => Promise<void> | void;
}

const noop = async () => {};

export function RegisterForm({ onSubmit = noop }: RegisterFormProps) {
  const t = useTranslations("auth.register");
  const validationMessages = useAuthValidationMessages();
  const scopedPath = useLocaleAwarePath();
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(() => createRegisterSchema(validationMessages), [validationMessages]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
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
        <Label htmlFor="register-email">{t("form.fields.email.label")}</Label>
        <Input
          id="register-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("form.fields.email.placeholder")}
          disabled={isSubmitting}
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
          disabled={isSubmitting}
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
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={errors.confirmPassword ? "register-confirm-password-error" : undefined}
          {...form.register("confirmPassword")}
        />
        <FieldError id="register-confirm-password-error" message={errors.confirmPassword?.message} />
      </div>

      <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="w-full">
        {isSubmitting ? t("form.actions.submitting") : t("form.actions.submit")}
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
