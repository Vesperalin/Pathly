import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";

const configDir = path.resolve(__dirname);
const envPath = path.resolve(configDir, ".env.test");

if (existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
} else {
  console.warn("Playwright could not locate .env.test in the project root.");
}

/**
 * Konfiguracja Playwright dla testów E2E
 * Dokumentacja: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 3 * 60 * 1000,

  // Uruchamiaj testy sekwencyjnie na początku (łatwiej debugować)
  // Zmień na true gdy będziesz mieć dużo testów i będą stabilne
  fullyParallel: false,

  // Fail jeśli zostawisz test.only (tylko w CI)
  forbidOnly: !!process.env.CI,

  // Retry tylko w CI (lokalnie lepiej od razu widzieć błędy)
  retries: process.env.CI ? 2 : 0,

  // Jeden worker lokalnie = łatwiej debugować
  // W CI też jeden dla stabilności
  workers: 1,

  // Reportery: HTML (po testach) i list (w terminalu)
  reporter: [["html"], ["list"]],

  use: {
    // Możesz pisać page.goto('/') zamiast pełnego URL
    baseURL: "http://localhost:3000",

    // Zbieraj trace tylko przy pierwszym retry, żeby ograniczyć narzut
    trace: "on-first-retry",

    // Screenshot przy błędach
    screenshot: "only-on-failure",

    // Bez wideo - screenshoty wystarczą na początku
    // (wideo zajmuje dużo miejsca)
    video: "off",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  globalTeardown: require.resolve("./e2e/global.teardown.ts"),

  // Automatycznie uruchamia dev server przed testami
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI, // Użyj istniejącego serwera lokalnie, uruchom nowy w CI
    timeout: 120 * 1000,
  },
});
