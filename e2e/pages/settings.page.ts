import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Page Object dla widoku ustawień (język + motyw).
 * Wspiera scenariusz 5 z dokumentu testowego.
 */
export class SettingsPage extends BasePage {
  readonly languageSection = this.page.getByTestId("language-switcher");
  readonly themeSection = this.page.getByTestId("theme-switcher");

  private buildPath(locale?: string) {
    return locale ? `/${locale}/settings` : "/settings";
  }

  async goto(locale?: string) {
    await super.goto(this.buildPath(locale));
    await this.languageSection.waitFor({ state: "visible" });
  }

  async selectLanguage(language: "pl" | "en") {
    await this.page.getByTestId(`language-option-${language}`).click();
  }

  async selectTheme(theme: "light" | "dark" | "system") {
    await this.page.getByTestId(`theme-option-${theme}`).click();
  }

  async expectLanguage(language: "pl" | "en") {
    await expect(this.languageSection).toHaveAttribute("data-current-language", language);
  }

  async expectTheme(theme: "light" | "dark" | "system") {
    const option = this.page.getByTestId(`theme-option-${theme}`);
    await expect(option).toHaveAttribute("aria-pressed", "true", { timeout: 15_000 });
  }

  async expectToast(message: RegExp | string) {
    await expect(this.page.getByRole("status").filter({ hasText: message })).toBeVisible({
      timeout: 15_000,
    });
  }
}
