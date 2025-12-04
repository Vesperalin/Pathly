"use client";

import { CatalogDetailsBreadcrumbs } from "@/app/[locale]/(private)/catalogs/[catalogId]/_components/CatalogDetailsBreadcrumbs";
import { CatalogDetailsHeader } from "@/app/[locale]/(private)/catalogs/[catalogId]/_components/CatalogDetailsHeader";
import { RouteList } from "@/app/[locale]/(private)/catalogs/[catalogId]/_components/RouteList";
import {
  CatalogFormModal,
  type CatalogFormValues,
} from "@/app/[locale]/(private)/dashboard/_components/CatalogFormModal";
import { DeleteConfirmationDialog } from "@/app/[locale]/(private)/dashboard/_components/DeleteConfirmationDialog";
import { Separator } from "@/components/ui/separator";
import {
  CatalogApiError,
  catalogRoutesFetcher,
  catalogRoutesKey,
  deleteCatalog,
  updateCatalog,
} from "@/features/catalogs/catalog.api";
import type { CatalogDetailsDto, PaginatedResponse, RouteInCatalogDto } from "@/types";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWRInfinite from "swr/infinite";

export interface CatalogDetailsViewProps {
  initialData: CatalogDetailsDto;
}

interface SubmissionError {
  field?: keyof CatalogFormValues;
  message: string;
}

export default function CatalogDetailsView({ initialData }: CatalogDetailsViewProps) {
  const translation = useTranslations("catalogs.details");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const [catalogDetails, setCatalogDetails] = useState<CatalogDetailsDto>(initialData);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [hasLoadMoreError, setHasLoadMoreError] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const pageSize = initialData.routes.pagination.page_size || 10;

  const localePrefix = useMemo(() => {
    const localeParam = params?.locale;
    const detected = Array.isArray(localeParam) ? localeParam[0] : localeParam;
    return detected ? `/${detected}` : "";
  }, [params]);

  const getKey = useCallback(
    (pageIndex: number, previousPageData: PaginatedResponse<RouteInCatalogDto> | null) => {
      if (previousPageData && isLastPage(previousPageData)) {
        return null;
      }

      const nextPage = pageIndex + 1;
      return catalogRoutesKey(initialData.id, nextPage, pageSize);
    },
    [initialData.id, pageSize]
  );

  const { data, error, isValidating, setSize } = useSWRInfinite<PaginatedResponse<RouteInCatalogDto>>(
    getKey,
    catalogRoutesFetcher,
    {
      fallbackData: [initialData.routes],
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const routePages = data ?? [];
  const routes = useMemo(() => routePages.flatMap((page) => page.data), [routePages]);

  const isInitialLoading = routePages.length === 0 && isValidating;
  const isReachingEnd = useMemo(() => {
    if (routePages.length === 0) {
      return true;
    }
    const lastPage = routePages[routePages.length - 1];
    return isLastPage(lastPage);
  }, [routePages]);

  const canManageCatalog = !catalogDetails.is_predefined;

  const headerLabels = useMemo(
    () => ({
      totalPoints: translation("header.totalPointsLabel"),
      actions: {
        edit: translation("header.actions.edit"),
        delete: translation("header.actions.delete"),
      },
    }),
    [translation]
  );

  const routeListLabels = useMemo(
    () => ({
      headers: {
        name: translation("routeList.headers.name"),
        date: translation("routeList.headers.date"),
        points: translation("routeList.headers.points"),
      },
      loading: translation("routeList.loading"),
      loadMore: translation("routeList.loadMore"),
      empty: {
        title: translation("routeList.empty.title"),
        description: translation("routeList.empty.description"),
      },
      error: {
        title: translation("routeList.error.title"),
        action: translation("routeList.error.action"),
      },
    }),
    [translation]
  );

  const loadMore = useCallback(async () => {
    if (isReachingEnd || isFetchingNext) {
      return;
    }

    setHasLoadMoreError(false);
    setIsFetchingNext(true);
    try {
      await setSize((current) => current + 1);
    } catch {
      setHasLoadMoreError(true);
      toast.error(translation("toast.routesError"));
    } finally {
      setIsFetchingNext(false);
    }
  }, [isFetchingNext, isReachingEnd, setSize, translation]);

  const handleManualLoadMore = useCallback(() => {
    void loadMore();
  }, [loadMore]);

  useEffect(() => {
    if (!loadMoreRef.current || isReachingEnd || hasLoadMoreError) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries.some((entry) => entry.isIntersecting);
        if (isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "0px 0px 200px 0px" }
    );

    const target = loadMoreRef.current;
    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasLoadMoreError, isReachingEnd, loadMore]);

  useEffect(() => {
    if (!error) {
      return;
    }

    setHasLoadMoreError(true);
    toast.error(translation("toast.routesError"));
  }, [error, translation]);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
  }, []);

  const openForm = useCallback(() => {
    setIsFormOpen(true);
  }, []);

  const openDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

  const handleFormSubmit = useCallback(
    async (values: CatalogFormValues) => {
      setIsSubmitting(true);

      try {
        const updatedCatalog = await updateCatalog(catalogDetails.id, values);
        setCatalogDetails((current) => ({
          ...current,
          name: updatedCatalog.name,
          updated_at: updatedCatalog.updated_at,
        }));
        toast.success(translation("toast.updateSuccess"));
        closeForm();
      } catch (error) {
        if (error instanceof CatalogApiError) {
          if (error.status === 409) {
            const submissionError: SubmissionError = {
              field: "name",
              message: translation("form.errors.conflict"),
            };
            throw submissionError;
          }

          const submissionError: SubmissionError = {
            message: error.message || translation("form.errors.unknown"),
          };
          throw submissionError;
        }

        const submissionError: SubmissionError = {
          message: translation("form.errors.unknown"),
        };
        throw submissionError;
      } finally {
        setIsSubmitting(false);
      }
    },
    [catalogDetails.id, closeForm, translation]
  );

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);

    try {
      await deleteCatalog(catalogDetails.id);
      toast.success(translation("toast.deleteSuccess"));
      closeDeleteDialog();
      router.push(`${localePrefix}/dashboard`);
    } catch (error) {
      if (error instanceof CatalogApiError) {
        toast.error(error.message || translation("toast.deleteError"));
      } else {
        toast.error(translation("toast.deleteError"));
      }
    } finally {
      setIsDeleting(false);
    }
  }, [catalogDetails.id, closeDeleteDialog, localePrefix, router, translation]);

  return (
    <div className="flex flex-col gap-6">
      <CatalogDetailsBreadcrumbs catalogName={catalogDetails.name} />
      <CatalogDetailsHeader
        catalog={catalogDetails}
        labels={headerLabels}
        canManage={canManageCatalog}
        onEdit={openForm}
        onDelete={openDeleteDialog}
      />
      <Separator />
      <RouteList
        routes={routes}
        isInitialLoading={isInitialLoading}
        isFetchingNext={isFetchingNext}
        isReachingEnd={isReachingEnd}
        hasLoadMoreError={hasLoadMoreError}
        labels={routeListLabels}
        loadMoreRef={loadMoreRef}
        onLoadMore={handleManualLoadMore}
        onRetry={handleManualLoadMore}
      />
      <CatalogFormModal
        isOpen={isFormOpen}
        mode="edit"
        defaultValues={{ name: catalogDetails.name }}
        isSubmitting={isSubmitting}
        copy={{
          title: translation("form.title"),
          submit: translation("form.submit"),
          cancel: translation("form.cancel"),
          fieldLabel: translation("form.fieldLabel"),
          fieldPlaceholder: translation("form.fieldPlaceholder"),
          unknownError: translation("form.errors.unknown"),
        }}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
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

function isLastPage(page: PaginatedResponse<RouteInCatalogDto>): boolean {
  const {
    pagination: { page: currentPage, page_size: pageSize, total },
    data,
  } = page;

  if (data.length === 0) {
    return true;
  }

  if (pageSize <= 0) {
    return true;
  }

  const loadedItems = currentPage * pageSize;
  return loadedItems >= total;
}
