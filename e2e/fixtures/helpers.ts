/**
 * Test fixtures i helpers dla Playwright
 * Użyj tego pliku do definiowania reużywalnych funkcji pomocniczych
 */

import { Page } from "@playwright/test";

/**
 * Logowanie użytkownika testowego
 */
export async function loginAsTestUser(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || "test@example.com");
  await page.getByLabel(/password|hasło/i).fill(process.env.TEST_USER_PASSWORD || "testpassword");
  await page.getByRole("button", { name: /sign in|zaloguj/i }).click();
  await page.waitForURL(/.*dashboard/);
}

/**
 * Czyszczenie danych testowych
 */
export async function cleanupTestData() {
  // Implementacja czyszczenia danych testowych
  // np. wywołanie API do usunięcia testowych rekordów
}

/**
 * Mockowanie API w przeglądarce
 */
export async function mockApiResponse(page: Page, url: string, response: unknown) {
  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}
