"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormErrorMessage } from "@/features/auth/components/FormMessage";
import {
  createChangePasswordSchema,
  type ChangePasswordFormValues,
  type ChangePasswordValidationMessages,
} from "@/features/auth/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface ChangePasswordFormProps {
  onSubmit?: (values: ChangePasswordFormValues) => Promise<void> | void;
}

const noop = async () => {};

export function ChangePasswordForm({ onSubmit = noop }: ChangePasswordFormProps) {
  const t = useTranslations("settings.security.changePassword");
  const [formError, setFormError] = useState<string | null>(null);

  const validationMessages = useMemo<ChangePasswordValidationMessages>(
    () => ({
      currentPassword: {
        required: t("validation.currentPassword.required"),
      },
      newPassword: {
        required: t("validation.newPassword.required"),
        minLength: t("validation.newPassword.minLength"),
        weak: t("validation.newPassword.weak"),
      },
      confirmPassword: {
        required: t("validation.confirmPassword.required"),
        mismatch: t("validation.confirmPassword.mismatch"),
      },
    }),
    [t]
  );

  const schema = useMemo(() => createChangePasswordSchema(validationMessages), [validationMessages]);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
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
      form.reset();
      toast.success(t("toast.success"));
    } catch (error) {
      console.error("Failed to change password", error);
      const fallbackMessage = t("errors.generic");
      const message = error instanceof Error && error.message ? error.message : fallbackMessage;
      setFormError(message);
    }
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <FormErrorMessage message={formError} />

      <div className="space-y-2">
        <Label htmlFor="current-password">{t("form.fields.currentPassword.label")}</Label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          placeholder={t("form.fields.currentPassword.placeholder")}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.currentPassword)}
          aria-describedby={errors.currentPassword ? "current-password-error" : undefined}
          {...form.register("currentPassword")}
        />
        <FieldError id="current-password-error" message={errors.currentPassword?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password">{t("form.fields.newPassword.label")}</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          placeholder={t("form.fields.newPassword.placeholder")}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.newPassword)}
          aria-describedby={errors.newPassword ? "new-password-error" : undefined}
          {...form.register("newPassword")}
        />
        <FieldError id="new-password-error" message={errors.newPassword?.message} />
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

      <p className="text-xs text-muted-foreground">{t("form.helper")}</p>

      <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? t("form.actions.submitting") : t("form.actions.submit")}
      </Button>
    </form>
  );
}
