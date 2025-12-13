"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormErrorMessage } from "@/features/auth/components/FormMessage";
import { useAuthValidationMessages, useLocaleAwarePath } from "@/features/auth/components/useAuthFormHelpers";
import { createPasswordResetRequestSchema, type PasswordResetRequestFormValues } from "@/features/auth/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

interface PasswordResetRequestFormProps {
  onSubmit?: (values: PasswordResetRequestFormValues) => Promise<void> | void;
}

const noop = async () => {};

export function PasswordResetRequestForm({ onSubmit = noop }: PasswordResetRequestFormProps) {
  const t = useTranslations("auth.resetRequest");
  const validationMessages = useAuthValidationMessages();
  const scopedPath = useLocaleAwarePath();
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(() => createPasswordResetRequestSchema(validationMessages), [validationMessages]);

  const form = useForm<PasswordResetRequestFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
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
        <Label htmlFor="reset-email">{t("form.fields.email.label")}</Label>
        <Input
          id="reset-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("form.fields.email.placeholder")}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "reset-email-error" : undefined}
          {...form.register("email")}
        />
        <FieldError id="reset-email-error" message={errors.email?.message} />
        <p className="text-xs text-muted-foreground">{t("form.helper")}</p>
      </div>

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
