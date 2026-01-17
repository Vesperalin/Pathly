import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Reprezentuje modal formularza katalogu (create / edit).
 */
export class CatalogFormModal extends BasePage {
  readonly modal = this.page.getByTestId("catalog-form-modal");
  readonly form = this.page.getByTestId("catalog-form");
  readonly nameInput = this.page.getByTestId("catalog-name-input");
  readonly submitButton = this.page.getByTestId("catalog-form-submit");
  readonly nameError = this.page.locator("#catalog-name-error");

  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  async submit() {
    await this.submitButton.click();
  }

  async expectVisible() {
    await expect(this.modal).toBeVisible();
  }

  async expectValidationMessage(message?: RegExp | string) {
    await expect(this.nameError).toBeVisible();
    if (message) {
      await expect(this.nameError).toContainText(message);
    }
  }
}
