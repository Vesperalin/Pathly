import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Page Object reprezentujący widok rejestracji.
 * Pokrywa scenariusz 1 z `ai/e2e-test-cases.md`.
 */
export class RegisterPage extends BasePage {
  readonly form = this.page.getByTestId("register-form");
  readonly emailInput = this.page.getByTestId("register-email");
  readonly passwordInput = this.page.getByTestId("register-password");
  readonly confirmPasswordInput = this.page.getByTestId("register-confirm-password");
  readonly submitButton = this.page.getByTestId("register-submit");
  readonly switchToLoginLink = this.page.getByTestId("register-switch-to-login");

  private buildPath(locale?: string) {
    return locale ? `/${locale}/register` : "/register";
  }

  async goto(locale?: string) {
    await super.goto(this.buildPath(locale));
    await this.form.waitFor({ state: "visible" });
  }

  async register(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    await this.submitButton.click();
  }

  async expectRedirectToDashboard() {
    await expect(this.page).toHaveURL(/\/dashboard/i);
  }
}
