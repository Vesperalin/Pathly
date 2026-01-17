import { expect, test } from "@playwright/test";
import { CatalogFormModal } from "./pages/catalog-form-modal.page";
import { DashboardPage } from "./pages/dashboard.page";
import { getLocale } from "./utils/locale";
import { logout } from "./utils/session";
import { registerTestUser } from "./utils/users";

const locale = getLocale();

test.describe("Zarządzanie katalogami", () => {
  test("użytkownik może utworzyć, zaktualizować i usunąć katalog", async ({ page }) => {
    await registerTestUser(page, locale, "catalogs");

    const dashboardPage = new DashboardPage(page);
    const catalogModal = new CatalogFormModal(page);

    const catalogName = `E2E Catalog ${Date.now()}`;

    await dashboardPage.clickAddCatalog();
    await catalogModal.expectVisible();
    await catalogModal.fillName("");
    await catalogModal.submit();
    await catalogModal.expectValidationMessage();

    await catalogModal.fillName(catalogName);
    await catalogModal.submit();
    await expect(dashboardPage.catalogRowByName(catalogName)).toBeVisible();

    const updatedName = `${catalogName} Updated`;
    await dashboardPage.clickEditCatalog(catalogName);
    await catalogModal.expectVisible();
    await catalogModal.fillName(updatedName);
    await catalogModal.submit();
    await expect(dashboardPage.catalogRowByName(updatedName)).toBeVisible();

    await dashboardPage.clickDeleteCatalog(updatedName);
    await expect(page.getByTestId("catalog-delete-dialog")).toBeVisible();
    await page.getByTestId("catalog-delete-confirm").click();
    await expect(dashboardPage.catalogRowByName(updatedName)).toHaveCount(0);

    await logout(page, locale);
  });
});
