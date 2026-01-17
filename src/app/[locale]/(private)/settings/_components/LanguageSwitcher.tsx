"use client";

import { Button } from "@/components/ui/button";
import type { Language } from "@/types";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export interface LanguageSwitcherProps {
  currentValue: Language;
  disabled?: boolean;
  onSelect: (language: Language) => void | Promise<void>;
}

export function LanguageSwitcher({ currentValue, disabled = false, onSelect }: LanguageSwitcherProps) {
  const translation = useTranslations("settings.personalization.language");

  const options = useMemo(
    () => [
      { value: "en" as Language, label: translation("options.en") },
      { value: "pl" as Language, label: translation("options.pl") },
    ],
    [translation]
  );

  return (
    <section
      aria-labelledby="language-preferences"
      className="space-y-4"
      data-testid="language-switcher"
      data-current-language={currentValue}
    >
      <div>
        <h3 id="language-preferences" className="text-sm font-medium leading-none">
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
              data-testid={`language-option-${option.value}`}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </section>
  );
}
