import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Page Object dla strony logowania
 * Przykład implementacji Page Object Model pattern
 */
export class LoginPage extends BasePage {
  // Selektory
  private readonly emailInput = this.page.getByLabel(/email/i);
  private readonly passwordInput = this.page.getByLabel(/password|hasło/i);
  private readonly submitButton = this.page.getByRole("button", {
    name: /sign in|zaloguj/i,
  });
  private readonly errorMessage = this.page.getByText(/invalid|błąd/i);

  async goto() {
    await super.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError() {
    await expect(this.errorMessage).toBeVisible();
  }

  async expectSuccessfulLogin() {
    await expect(this.page).toHaveURL(/.*dashboard/);
  }
}
