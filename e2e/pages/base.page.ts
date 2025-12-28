import { Page } from "@playwright/test";

/**
 * Klasa bazowa dla Page Object Model
 * Wykorzystaj ten pattern do tworzenia reprezentacji stron aplikacji
 */
export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async getTitle() {
    return await this.page.title();
  }

  async waitForLoadState() {
    await this.page.waitForLoadState("networkidle");
  }
}
