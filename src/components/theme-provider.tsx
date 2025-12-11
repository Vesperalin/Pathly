"use client";

import type { ThemeProviderProps as NextThemeProviderProps } from "next-themes";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ReactNode } from "react";

type ThemeProviderProps = Pick<
  NextThemeProviderProps,
  "attribute" | "defaultTheme" | "enableSystem" | "disableTransitionOnChange"
> & {
  children: ReactNode;
};

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = true,
}: ThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
    >
      {children}
    </NextThemeProvider>
  );
}
