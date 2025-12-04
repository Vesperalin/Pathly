"use client";

import { Button } from "@/components/ui/button";
import type { Theme } from "@/types";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export interface ThemeSwitcherProps {
  currentValue: Theme;
  disabled?: boolean;
  onSelect: (theme: Theme) => void | Promise<void>;
}

export function ThemeSwitcher({ currentValue, disabled = false, onSelect }: ThemeSwitcherProps) {
  const translation = useTranslations("settings.personalization.theme");

  const options = useMemo(
    () => [
      { value: "light" as Theme, label: translation("options.light") },
      { value: "dark" as Theme, label: translation("options.dark") },
      { value: "system" as Theme, label: translation("options.system") },
    ],
    [translation]
  );

  return (
    <section aria-labelledby="theme-preferences" className="space-y-4">
      <div>
        <h3 id="theme-preferences" className="text-sm font-medium leading-none">
          {translation("label")}
        </h3>
        <p className="text-sm text-muted-foreground">{translation("description")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = option.value === currentValue;

          return (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={isActive ? "default" : "outline"}
              aria-pressed={isActive}
              disabled={disabled || isActive}
              onClick={() => {
                if (disabled) return;
                const result = onSelect(option.value);
                if (result instanceof Promise) {
                  void result;
                }
              }}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </section>
  );
}
