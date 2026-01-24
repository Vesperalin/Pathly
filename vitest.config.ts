import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

/**
 * Konfiguracja Vitest dla testów jednostkowych
 * Dokumentacja: https://vitest.dev/config/
 */
export default defineConfig({
  plugins: [react()],
  test: {
    // Środowisko jsdom - symuluje przeglądarkę (DOM, window, document)
    environment: "jsdom",

    // Globalne funkcje (describe, it, expect) bez importów
    globals: true,

    // Setup wykonywany przed testami (mocki, @testing-library/jest-dom)
    setupFiles: ["./src/test/setup-tests.ts"],

    // Wspiera importy CSS w testach (nie failuje na import './styles.css')
    css: true,

    // Konfiguracja pokrycia kodu
    coverage: {
      provider: "v8",

      // Reportery: text (terminal) i html (przeglądarka)
      reporter: ["text", "html"],

      // Co wykluczyć z pokrycia
      exclude: [
        "node_modules/",
        "src/test/", // Same testy
        "**/*.d.ts", // Pliki typów
        "**/*.config.*", // Pliki konfiguracyjne
        "**/mockData", // Mock data
        "**/.{idea,git,cache,output,temp}",
        "src/db/database.types.ts", // Auto-generowane typy Supabase
        "src/middleware.ts", // Middleware Next.js
      ],

      // Progi pokrycia - tylko gdy explicite wymusimy je przez zmienną środowiskową
      ...(process.env.VITEST_ENFORCE_COVERAGE === "true"
        ? {
            thresholds: {
              lines: 60,
              functions: 60,
              branches: 60,
              statements: 60,
            },
          }
        : {}),
    },

    // Które pliki są testami
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],

    // Co wykluczyć
    exclude: ["node_modules", "dist", ".next", "e2e"],
  },

  // Aliasy ścieżek (@/components -> src/components)
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
