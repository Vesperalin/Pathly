"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { MouseEvent } from "react";
import { useCallback } from "react";

export interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
}

export default function DeleteConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isPending,
  title,
  description,
  cancelLabel,
  confirmLabel,
}: DeleteConfirmationDialogProps) {
  const handleConfirm = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      await onConfirm();
    },
    [onConfirm]
  );

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending} className="inline-flex items-center gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            <span>{confirmLabel}</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
