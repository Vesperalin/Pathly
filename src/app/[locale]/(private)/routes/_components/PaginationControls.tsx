"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useMemo } from "react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
  onPageChange: (page: number) => void;
  isPending: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  previousLabel,
  nextLabel,
  pageLabel,
  onPageChange,
  isPending,
}: PaginationControlsProps) {
  const pages = useMemo(() => buildPaginationRange(currentPage, totalPages), [currentPage, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <section className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{pageLabel}</p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1 || isPending}
            >
              {previousLabel}
            </PaginationPrevious>
          </PaginationItem>
          {pages.map((page, index) =>
            page === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => onPageChange(page)}
                  disabled={page === currentPage || isPending}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages || isPending}
            >
              {nextLabel}
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </section>
  );
}

function buildPaginationRange(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const range: (number | "ellipsis")[] = [1];
  const siblingCount = 1;
  const leftSibling = Math.max(current - siblingCount, 2);
  const rightSibling = Math.min(current + siblingCount, total - 1);

  if (leftSibling > 2) {
    range.push("ellipsis");
  }

  for (let page = leftSibling; page <= rightSibling; page += 1) {
    range.push(page);
  }

  if (rightSibling < total - 1) {
    range.push("ellipsis");
  }

  range.push(total);

  return range;
}
