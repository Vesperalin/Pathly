import { expect, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

interface CatalogRow {
  id: string;
  isPredefined: boolean;
  locator: Locator;
}

/**
 * Page Object dla dashboardu / list katalogów.
 * Obsługuje scenariusze: onboarding (sprawdzenie katalogów GOT) oraz CRUD katalogu.
 */
export class DashboardPage extends BasePage {
  readonly userCatalogCard = this.page.getByTestId("user-catalog-list");
  readonly systemCatalogCard = this.page.getByTestId("system-catalog-list");
  readonly catalogAddButton = this.page.getByTestId("catalog-add-button");
  readonly emptyState = this.page.getByTestId("catalog-empty-state");

  private buildPath(locale?: string) {
    return locale ? `/${locale}/dashboard` : "/dashboard";
  }

  async goto(locale?: string) {
    await super.goto(this.buildPath(locale));
    await this.waitForReady();
  }

  catalogRows(): Locator {
    return this.page.getByTestId("catalog-row");
  }

  catalogRowByName(name: string): Locator {
    return this.catalogRows().filter({ hasText: name });
  }

  async getCatalogMetadataByName(name: string): Promise<CatalogRow> {
    const row = this.catalogRowByName(name).first();
    const catalogId = await row.getAttribute("data-catalog-id");
    const predefined = (await row.getAttribute("data-catalog-predefined")) === "true";
    if (!catalogId) {
      throw new Error(`Catalog "${name}" does not expose data-catalog-id attribute`);
    }
    return { id: catalogId, isPredefined: predefined, locator: row };
  }

  async expectPredefinedCatalogs(names: string[]) {
    for (const name of names) {
      await expect(this.catalogRowByName(name)).toBeVisible();
    }
  }

  async openCatalogByName(name: string) {
    await this.catalogRowByName(name).getByTestId("catalog-row-link").click();
  }

  async openCatalogActions(name: string) {
    await this.catalogRowByName(name).getByTestId("catalog-row-actions").click();
  }

  async clickEditCatalog(name: string) {
    await this.openCatalogActions(name);
    await this.page.getByTestId("catalog-row-edit").click();
  }

  async clickDeleteCatalog(name: string) {
    await this.openCatalogActions(name);
    await this.page.getByTestId("catalog-row-delete").click();
  }

  async clickAddCatalog() {
    await this.catalogAddButton.click();
  }

  async expectEmptyStateVisible() {
    await expect(this.emptyState).toBeVisible();
  }

  async waitForContent(timeout = 15_000) {
    const candidates: Locator[] = [
      this.userCatalogCard,
      this.systemCatalogCard,
      this.emptyState,
      this.page.getByTestId("catalog-table"),
    ];

    const expectations = candidates.map(async (locator) => {
      await locator.first().waitFor({ state: "visible", timeout });
    });

    try {
      await Promise.any(expectations);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new Error("Dashboard content failed to render: żaden kluczowy komponent nie pojawił się przed timeoutem.");
    }
  }

  private async waitForReady() {
    const candidates: Locator[] = [
      this.userCatalogCard,
      this.systemCatalogCard,
      this.page.getByTestId("catalog-empty-state"),
      this.page.getByTestId("catalog-table"),
    ];

    // Zwiększony timeout i lepsze error handling
    for (const locator of candidates) {
      try {
        await locator.first().waitFor({ state: "visible", timeout: 10000 });
        return;
      } catch {
        // try next candidate
      }
    }

    // Jeśli żaden locator nie zostanie znaleziony, poczekaj na networkidle
    await this.page.waitForLoadState("networkidle", { timeout: 10000 });
  }
}
