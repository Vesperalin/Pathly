import { defineConfig, devices } from "@playwright/test";

/**
 * Konfiguracja Playwright dla testów E2E
 * Dokumentacja: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",

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

    // Zbieraj trace zawsze (będziesz mógł zobaczyć co się stało)
    trace: "on",

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

  // Automatycznie uruchamia dev server przed testami
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true, // Nie restartuj jeśli już jest uruchomiony
    timeout: 120 * 1000, // 2 minuty na uruchomienie
  },
});
