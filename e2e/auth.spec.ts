import { expect, test } from "@playwright/test";
import { DashboardPage } from "./pages/dashboard.page";
import { getLocale } from "./utils/locale";
import { logout } from "./utils/session";
import { registerTestUser } from "./utils/users";

const locale = getLocale();
const PREDEFINED_CATALOGS = ["Popularna", "Mała Brązowa", "Mała Srebrna", "Mała Złota"];

test.describe("Autoryzacja i RLS", () => {
  test("nowa rejestracja tworzy katalogi GOT", async ({ page }) => {
    await registerTestUser(page, locale, "onboarding");

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.expectPredefinedCatalogs(PREDEFINED_CATALOGS);
    await expect(dashboardPage.userCatalogCard).toBeVisible();

    await logout(page, locale);
  });
});
