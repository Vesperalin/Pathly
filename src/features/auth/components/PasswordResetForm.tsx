"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormErrorMessage } from "@/features/auth/components/FormMessage";
import { useAuthValidationMessages, useLocaleAwarePath } from "@/features/auth/components/useAuthFormHelpers";
import { createPasswordResetSchema, type PasswordResetFormValues } from "@/features/auth/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

interface PasswordResetFormProps {
  onSubmit?: (values: PasswordResetFormValues) => Promise<void> | void;
}

const noop = async () => {};

export function PasswordResetForm({ onSubmit = noop }: PasswordResetFormProps) {
  const t = useTranslations("auth.reset");
  const validationMessages = useAuthValidationMessages();
  const scopedPath = useLocaleAwarePath();
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(() => createPasswordResetSchema(validationMessages), [validationMessages]);

  const form = useForm<PasswordResetFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
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
        <Label htmlFor="new-password">{t("form.fields.password.label")}</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          placeholder={t("form.fields.password.placeholder")}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "new-password-error" : undefined}
          {...form.register("password")}
        />
        <FieldError id="new-password-error" message={errors.password?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-new-password">{t("form.fields.confirmPassword.label")}</Label>
        <Input
          id="confirm-new-password"
          type="password"
          autoComplete="new-password"
          placeholder={t("form.fields.confirmPassword.placeholder")}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
          {...form.register("confirmPassword")}
        />
        <FieldError id="confirm-password-error" message={errors.confirmPassword?.message} />
      </div>

      <p className="text-xs text-muted-foreground">{t("helper")}</p>

      <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="w-full">
        {isSubmitting ? t("form.actions.submitting") : t("form.actions.submit")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href={scopedPath("/login")} className="font-medium text-primary hover:underline">
          {t("links.backToLogin")}
        </Link>
      </p>
    </form>
  );
}
