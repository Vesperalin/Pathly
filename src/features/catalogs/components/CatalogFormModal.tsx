"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CatalogPreviewDto, CreateCatalogCommand, UpdateCatalogCommand } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import type { ZodTypeAny } from "zod";

interface CatalogFormViewModel {
  name: string;
}

export interface CatalogFormModalTexts {
  titleCreate: string;
  titleEdit: string;
  labelName: string;
  buttonSave: string;
  buttonSaving: string;
}

export interface CatalogFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: CreateCatalogCommand | UpdateCatalogCommand) => Promise<void>;
  initialData?: CatalogPreviewDto;
  texts: CatalogFormModalTexts;
  validationSchema: ZodTypeAny;
}

type CatalogFormSubmitPayload = CreateCatalogCommand | UpdateCatalogCommand;

export function CatalogFormModal({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  texts,
  validationSchema,
}: CatalogFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = useMemo<CatalogFormViewModel>(
    () => ({
      name: initialData?.name ?? "",
    }),
    [initialData?.name]
  );

  const form = useForm<CatalogFormViewModel>({
    resolver: zodResolver(validationSchema as never) as unknown as Resolver<CatalogFormViewModel>,
    defaultValues,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset(defaultValues);
  }, [defaultValues, form, isOpen]);

  const handleOpenChange = useCallback(
    (nextIsOpen: boolean) => {
      onOpenChange(nextIsOpen);
    },
    [onOpenChange]
  );

  const getErrorMessage = useCallback((maybeError: unknown): string | null => {
    if (!maybeError || typeof maybeError !== "object") {
      return null;
    }

    if ("message" in maybeError && typeof (maybeError as { message?: unknown }).message === "string") {
      return (maybeError as { message?: string }).message ?? null;
    }

    return null;
  }, []);

  const handleSubmit = useCallback(
    async (values: CatalogFormViewModel) => {
      setIsSubmitting(true);
      form.clearErrors();

      const payload: CatalogFormSubmitPayload = {
        name: values.name.trim(),
      };

      try {
        await onSubmit(payload);
        onOpenChange(false);
      } catch (error) {
        const message = getErrorMessage(error);
        if (message) {
          form.setError("name", { message });
        } else {
          console.error("CatalogFormModal submission failed without message", error);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, getErrorMessage, onOpenChange, onSubmit]
  );

  const dialogTitle = initialData ? texts.titleEdit : texts.titleCreate;
  const submitLabel = isSubmitting ? texts.buttonSaving : texts.buttonSave;
  const nameError = form.formState.errors.name?.message;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="catalog-form-modal">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)} noValidate data-testid="catalog-form">
          <div className="space-y-2">
            <Label htmlFor="catalog-name">{texts.labelName}</Label>
            <Input
              id="catalog-name"
              disabled={isSubmitting}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "catalog-name-error" : undefined}
              data-testid="catalog-name-input"
              {...form.register("name")}
            />
            {nameError ? (
              <p id="catalog-name-error" className="text-sm text-destructive">
                {nameError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} data-testid="catalog-form-submit">
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
