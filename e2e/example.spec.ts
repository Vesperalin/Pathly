import { expect, Page, test } from "@playwright/test";

/**
 * Przykładowy test E2E dla strony głównej
 * Demonstracja podstawowych wzorców testowania z Playwright
 */

test.describe("Homepage", () => {
  test("should load the homepage successfully", async ({ page }) => {
    await page.goto("/");

    // Sprawdź czy strona się załadowała
    await expect(page).toHaveTitle(/Pathly/i);
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");

    // Przykład - kliknięcie w link do logowania
    // Dostosuj selektory do rzeczywistej struktury aplikacji
    const loginLink = page.getByRole("link", { name: /sign in|zaloguj/i });

    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/.*login/);
    }
  });
});

/**
 * Przykładowy test autentykacji
 */
test.describe("Authentication Flow", () => {
  test.skip("should login with valid credentials", async ({ page }) => {
    // Skip - wymaga działającego środowiska testowego
    await page.goto("/login");

    // Wypełnij formularz logowania
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password|hasło/i).fill("testpassword");

    // Kliknij przycisk logowania
    await page.getByRole("button", { name: /sign in|zaloguj/i }).click();

    // Sprawdź przekierowanie do dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test.skip("should show error for invalid credentials", async ({ page }) => {
    // Skip - wymaga działającego środowiska testowego
    await page.goto("/login");

    await page.getByLabel(/email/i).fill("invalid@example.com");
    await page.getByLabel(/password|hasło/i).fill("wrongpassword");

    await page.getByRole("button", { name: /sign in|zaloguj/i }).click();

    // Sprawdź czy pojawił się komunikat o błędzie
    await expect(page.getByText(/invalid|błąd/i)).toBeVisible();
  });
});

/**
 * Przykładowy test z Page Object Model
 */
class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/password|hasło/i).fill(password);
    await this.page.getByRole("button", { name: /sign in|zaloguj/i }).click();
  }

  async getErrorMessage() {
    return this.page.getByText(/invalid|błąd/i);
  }
}

test.describe("Login Page (POM Pattern)", () => {
  test.skip("should demonstrate Page Object Model pattern", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login("test@example.com", "password123");

    // Sprawdź rezultat
    await expect(page).toHaveURL(/.*dashboard/);
  });
});

/**
 * Przykładowy test dostępności (a11y) z @axe-core/playwright
 */
test.describe("Accessibility", () => {
  test.skip("should not have any automatically detectable accessibility issues", async ({ page }) => {
    // Ten test wymaga instalacji @axe-core/playwright
    // import { injectAxe, checkA11y } from '@axe-core/playwright';

    await page.goto("/");

    // await injectAxe(page);
    // await checkA11y(page, null, {
    //   detailedReport: true,
    //   detailedReportOptions: { html: true },
    // });
  });
});

/**
 * Przykładowy test responsywności / mobile
 */
test.describe("Mobile Experience", () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test("should display mobile menu on small screens", async ({ page }) => {
    await page.goto("/");

    // Sprawdź czy menu mobilne jest widoczne
    const mobileMenuButton = page.getByRole("button", { name: /menu/i });
    if (await mobileMenuButton.isVisible()) {
      await expect(mobileMenuButton).toBeVisible();
    }
  });
});
