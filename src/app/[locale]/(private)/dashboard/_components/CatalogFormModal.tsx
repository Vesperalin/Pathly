"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const catalogFormSchema = z.object({
  name: z.string().min(1).max(255),
});

export type CatalogFormValues = z.infer<typeof catalogFormSchema>;

export type CatalogFormMode = "create" | "edit";

interface CatalogFormModalCopy {
  title: string;
  submit: string;
  fieldLabel: string;
  fieldPlaceholder: string;
  unknownError: string;
  cancel: string;
}

interface CatalogFormModalProps {
  isOpen: boolean;
  mode: CatalogFormMode;
  defaultValues?: CatalogFormValues | null;
  isSubmitting: boolean;
  copy: CatalogFormModalCopy;
  onClose: () => void;
  onSubmit: (values: CatalogFormValues) => Promise<void>;
}

interface SubmissionError {
  field?: keyof CatalogFormValues;
  message: string;
}

function isSubmissionError(error: unknown): error is SubmissionError {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "message" in error && typeof (error as SubmissionError).message === "string";
}

export function CatalogFormModal({
  isOpen,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mode,
  defaultValues,
  isSubmitting,
  copy,
  onClose,
  onSubmit,
}: CatalogFormModalProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CatalogFormValues>({
    resolver: zodResolver(catalogFormSchema),
    defaultValues: defaultValues ?? { name: "" },
  });

  const heading = useMemo(() => copy.title, [copy.title]);
  const submitLabel = useMemo(() => copy.submit, [copy.submit]);

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues ?? { name: "" });
      setFormError(null);
    }
  }, [defaultValues, form, isOpen]);

  const handleOpenChange = (nextValue: boolean) => {
    if (!nextValue) {
      onClose();
    }
  };

  const handleSubmit = async (values: CatalogFormValues) => {
    setFormError(null);
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      if (isSubmissionError(error)) {
        if (error.field) {
          form.setError(error.field, { message: error.message });
          return;
        }

        setFormError(error.message || copy.unknownError);
        return;
      }

      setFormError(copy.unknownError);
    }
  };

  const nameError = form.formState.errors.name?.message;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
        </DialogHeader>
        <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="catalog-name">{copy.fieldLabel}</Label>
            <Input
              id="catalog-name"
              placeholder={copy.fieldPlaceholder}
              disabled={isSubmitting}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "catalog-name-error" : undefined}
              {...form.register("name")}
            />
            {nameError ? (
              <p id="catalog-name-error" className="text-sm text-destructive">
                {nameError}
              </p>
            ) : null}
          </div>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {copy.cancel ?? "Cancel"}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? `${submitLabel}…` : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
