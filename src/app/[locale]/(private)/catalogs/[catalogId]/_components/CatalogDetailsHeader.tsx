"use client";

import { Breadcrumbs } from "@/components/layout/BreadcrumbsContext";
import { Button } from "@/components/ui/button";
import type { CatalogDetailsDto } from "@/types";

interface CatalogDetailsHeaderProps {
  catalog: CatalogDetailsDto;
  labels: {
    totalPoints: string;
    actions: {
      edit: string;
      delete: string;
    };
  };
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function CatalogDetailsHeader({ catalog, labels, canManage, onEdit, onDelete }: CatalogDetailsHeaderProps) {
  const totalPoints = catalog.total_points ?? 0;

  return (
    <header className="space-y-4">
      <Breadcrumbs />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{catalog.name}</h1>
          <p className="text-sm text-muted-foreground">
            {labels.totalPoints}:{" "}
            <span className="font-medium text-foreground" aria-live="polite">
              {totalPoints}
            </span>
          </p>
        </div>
        {canManage ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onEdit}>
              {labels.actions.edit}
            </Button>
            <Button type="button" variant="destructive" onClick={onDelete}>
              {labels.actions.delete}
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
