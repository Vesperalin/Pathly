import { expect, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Page Object dla strony logowania oparty o stabilne selektory data-testid.
 * Używany w scenariuszach z @ai/e2e-test-cases.md (logowanie, egzekwowanie RLS).
 */
export class LoginPage extends BasePage {
  readonly form = this.page.getByTestId("login-form");
  readonly emailInput = this.page.getByTestId("login-email");
  readonly passwordInput = this.page.getByTestId("login-password");
  readonly submitButton = this.page.getByTestId("login-submit");
  readonly createAccountPrompt = this.page.getByTestId("login-create-account-prompt");
  readonly createAccountLink = this.page.getByTestId("login-create-account-link");
  readonly switchToRegisterLink = this.page.getByTestId("login-switch-to-register");

  private buildPath(locale?: string) {
    return locale ? `/${locale}/login` : "/login";
  }

  async goto(locale?: string) {
    await super.goto(this.buildPath(locale));
    await this.form.waitFor({ state: "visible" });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectErrorMessage(message?: RegExp | string) {
    await expect(this.form.getByText(message ?? /error|błąd/i)).toBeVisible();
  }

  async expectCreateAccountPromptVisible() {
    await expect(this.createAccountPrompt).toBeVisible();
  }

  async expectFormVisible() {
    await expect(this.form).toBeVisible();
  }

  async expectSwitchToRegisterVisible() {
    await expect(this.switchToRegisterLink).toBeVisible();
  }

  async expectRedirectToDashboard() {
    await expect(this.page).toHaveURL(/\/dashboard/i);
  }

  get toast(): Locator {
    return this.page.getByRole("status");
  }
}
