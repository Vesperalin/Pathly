"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Loader2, Search } from "lucide-react";
import { useId } from "react";

interface SortOption {
  value: string;
  label: string;
}

interface RoutesToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  isPending: boolean;
  sortLabel: string;
  sortOptions: SortOption[];
  selectedSort: string;
  onSortChange: (value: string) => void;
  activeSortLabel: string;
}

export function RoutesToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  isPending,
  sortLabel,
  sortOptions,
  selectedSort,
  onSortChange,
  activeSortLabel,
}: RoutesToolbarProps) {
  const searchInputId = useId();

  return (
    <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="w-full md:max-w-md">
        <label htmlFor={searchInputId} className="sr-only">
          {searchPlaceholder}
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={searchInputId}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
            autoComplete="off"
            aria-busy={isPending}
          />
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full md:w-auto" disabled={isPending}>
            <ArrowUpDown className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>{activeSortLabel}</span>
            {isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>{sortLabel}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={selectedSort} onValueChange={onSortChange}>
            {sortOptions.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </section>
  );
}
