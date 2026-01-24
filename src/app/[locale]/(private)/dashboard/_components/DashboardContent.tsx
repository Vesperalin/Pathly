"use client";

import { CatalogList } from "@/app/[locale]/(private)/dashboard/_components/CatalogList";
import { DeleteConfirmationDialog } from "@/app/[locale]/(private)/dashboard/_components/DeleteConfirmationDialog";
import {
  CatalogApiError,
  catalogsFetcher,
  createCatalog,
  deleteCatalog,
  updateCatalog,
  userCatalogsKey,
} from "@/features/catalogs/catalog.api";
import { CatalogFormModal } from "@/features/catalogs/components/CatalogFormModal";
import type { CatalogPreviewDto, CreateCatalogCommand, UpdateCatalogCommand } from "@/types";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { z } from "zod";

export interface DashboardContentProps {
  initialPredefinedCatalogs: CatalogPreviewDto[];
  initialUserCatalogs: CatalogPreviewDto[];
  predefinedError?: boolean;
  userError?: boolean;
}

type CatalogFormMode = "create" | "edit";

export default function DashboardContent({
  initialPredefinedCatalogs,
  initialUserCatalogs,
  predefinedError = false,
  userError = false,
}: DashboardContentProps) {
  const translation = useTranslations("dashboard");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<CatalogFormMode>("create");
  const [editingCatalog, setEditingCatalog] = useState<CatalogPreviewDto | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCatalog, setDeletingCatalog] = useState<CatalogPreviewDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: userCatalogs,
    error: userCatalogsError,
    isValidating: isRefreshingUserCatalogs,
    mutate: mutateUserCatalogs,
  } = useSWR<CatalogPreviewDto[]>(userCatalogsKey(), catalogsFetcher, {
    fallbackData: initialUserCatalogs,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  useEffect(() => {
    if (!userCatalogsError) {
      return;
    }

    toast.error(translation("toast.fetchError"));
  }, [translation, userCatalogsError]);

  const closeFormModal = useCallback(() => {
    setIsFormOpen(false);
    setEditingCatalog(null);
    setFormMode("create");
  }, []);

  const openCreateModal = useCallback(() => {
    setFormMode("create");
    setEditingCatalog(null);
    setIsFormOpen(true);
  }, []);

  const openEditModal = useCallback((catalog: CatalogPreviewDto) => {
    setFormMode("edit");
    setEditingCatalog(catalog);
    setIsFormOpen(true);
  }, []);

  const openDeleteDialog = useCallback((catalog: CatalogPreviewDto) => {
    setDeletingCatalog(catalog);
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeletingCatalog(null);
    setIsDeleteDialogOpen(false);
  }, []);

  const handleRetry = useCallback(() => {
    void mutateUserCatalogs();
  }, [mutateUserCatalogs]);

  const catalogFormSchema = useMemo(() => {
    return z.object({
      name: z
        .string()
        .min(3, translation("form.validation.name.minLength"))
        .max(255, translation("form.validation.name.maxLength")),
    });
  }, [translation]);

  const handleModalOpenChange = useCallback((nextIsOpen: boolean) => {
    setIsFormOpen(nextIsOpen);

    if (!nextIsOpen) {
      setEditingCatalog(null);
      setFormMode("create");
    }
  }, []);

  const handleFormSubmit = useCallback(
    async (values: CreateCatalogCommand | UpdateCatalogCommand) => {
      let updatedCatalog: CatalogPreviewDto;

      try {
        if (formMode === "create") {
          updatedCatalog = await createCatalog(values);
          toast.success(translation("form.toast.created"));
        } else if (formMode === "edit" && editingCatalog) {
          updatedCatalog = await updateCatalog(editingCatalog.id, values);
          toast.success(translation("form.toast.updated"));
        } else {
          throw new Error("Unsupported form mode.");
        }

        await mutateUserCatalogs(
          (currentCatalogs) => {
            const nextCatalogs = upsertCatalog(currentCatalogs ?? [], updatedCatalog);
            return nextCatalogs;
          },
          { revalidate: false, populateCache: true }
        );

        closeFormModal();
      } catch (error) {
        if (error instanceof CatalogApiError) {
          if (error.status === 409) {
            throw new Error(translation("form.errors.conflict"));
          }

          const message = error.message || translation("form.errors.unknown");
          toast.error(message);
          throw new Error(message);
        }

        toast.error(translation("form.errors.unknown"));
        throw new Error(translation("form.errors.unknown"));
      }
    },
    [closeFormModal, editingCatalog, formMode, mutateUserCatalogs, translation]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingCatalog) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteCatalog(deletingCatalog.id);
      toast.success(translation("deleteDialog.toast.success"));
      await mutateUserCatalogs(
        (currentCatalogs) => {
          if (!currentCatalogs) {
            return [];
          }
          return currentCatalogs.filter((catalog) => catalog.id !== deletingCatalog.id);
        },
        { revalidate: false, populateCache: true }
      );
      closeDeleteDialog();
    } catch (error) {
      if (error instanceof CatalogApiError) {
        toast.error(error.message || translation("deleteDialog.toast.error"));
      } else {
        toast.error(translation("deleteDialog.toast.error"));
      }
    } finally {
      setIsDeleting(false);
    }
  }, [closeDeleteDialog, deletingCatalog, mutateUserCatalogs, translation]);

  const userCatalogList = userCatalogs ?? [];
  const predefinedCatalogList = useMemo(() => initialPredefinedCatalogs ?? [], [initialPredefinedCatalogs]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <CatalogList
        title={translation("sections.predefined.title")}
        catalogs={predefinedCatalogList}
        isUserList={false}
        isLoading={false}
        isRefreshing={false}
        error={
          predefinedError
            ? {
                title: translation("status.error.title"),
                description: translation("status.error.description"),
                actionLabel: translation("status.error.retry"),
                onRetry: handleRetry,
              }
            : null
        }
        emptyState={{
          title: translation("sections.predefined.empty.title"),
          description: translation("sections.predefined.empty.description"),
        }}
        labels={{
          name: translation("catalogList.headers.name"),
          points: translation("catalogList.headers.points"),
          updatedAt: translation("catalogList.headers.updatedAt"),
          actionsLabel: translation("catalogList.actions.label"),
          edit: translation("catalogList.actions.edit"),
          delete: translation("catalogList.actions.delete"),
          refreshing: translation("catalogList.refreshing"),
        }}
      />

      <CatalogList
        title={translation("sections.user.title")}
        catalogs={userCatalogList}
        isUserList
        isLoading={!userCatalogs && !userCatalogsError}
        isRefreshing={isRefreshingUserCatalogs}
        error={
          userError || userCatalogsError
            ? {
                title: translation("status.error.title"),
                description: translation("status.error.description"),
                actionLabel: translation("status.error.retry"),
                onRetry: handleRetry,
              }
            : null
        }
        emptyState={{
          title: translation("sections.user.empty.title"),
          description: translation("sections.user.empty.description"),
          actionLabel: translation("sections.user.actions.add"),
        }}
        addActionLabel={translation("sections.user.actions.add")}
        labels={{
          name: translation("catalogList.headers.name"),
          points: translation("catalogList.headers.points"),
          updatedAt: translation("catalogList.headers.updatedAt"),
          actionsLabel: translation("catalogList.actions.label"),
          edit: translation("catalogList.actions.edit"),
          delete: translation("catalogList.actions.delete"),
          refreshing: translation("catalogList.refreshing"),
        }}
        onAdd={openCreateModal}
        onEdit={openEditModal}
        onDelete={openDeleteDialog}
        onRetry={handleRetry}
      />

      <CatalogFormModal
        isOpen={isFormOpen}
        onOpenChange={handleModalOpenChange}
        onSubmit={handleFormSubmit}
        initialData={formMode === "edit" ? (editingCatalog ?? undefined) : undefined}
        texts={{
          titleCreate: translation("form.create.title"),
          titleEdit: translation("form.edit.title"),
          labelName: translation("form.fields.name.label"),
          buttonSave: formMode === "create" ? translation("form.create.submit") : translation("form.edit.submit"),
          buttonSaving: translation("form.state.saving"),
        }}
        validationSchema={catalogFormSchema}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        isLoading={isDeleting}
        title={translation("deleteDialog.title")}
        description={translation("deleteDialog.description")}
        confirmLabel={translation("deleteDialog.confirm")}
        cancelLabel={translation("deleteDialog.cancel")}
        onCancel={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

function upsertCatalog(catalogs: CatalogPreviewDto[], nextCatalog: CatalogPreviewDto): CatalogPreviewDto[] {
  const index = catalogs.findIndex((catalog) => catalog.id === nextCatalog.id);
  if (index === -1) {
    return [...catalogs, nextCatalog];
  }

  const next = [...catalogs];
  next[index] = nextCatalog;
  return next;
}
