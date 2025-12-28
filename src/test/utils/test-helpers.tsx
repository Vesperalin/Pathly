import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";

/**
 * Custom render function that wraps components with necessary providers
 */

interface AllProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: AllProvidersProps) {
  // Dodaj tutaj wszystkie providery potrzebne w testach
  // np. ThemeProvider, IntlProvider, Router, etc.
  return <>{children}</>;
}

/**
 * Render komponentu z wszystkimi providerami
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Helper do tworzenia mock routera
 */
export function createMockRouter(overrides = {}) {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
    ...overrides,
  };
}
