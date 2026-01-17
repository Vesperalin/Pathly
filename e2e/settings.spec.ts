import { expect, Page, test } from "@playwright/test";
import { SettingsPage } from "./pages/settings.page";
import { getLocale } from "./utils/locale";
import { logout } from "./utils/session";
import { registerTestUser } from "./utils/users";

const locale = getLocale();

async function prepareNewSettingsSession(page: Page) {
  const credentials = await registerTestUser(page, locale, "settings");
  const settingsPage = new SettingsPage(page);
  await settingsPage.goto(locale);
  return { credentials, settingsPage };
}

test.describe("Personalizacja interfejsu", () => {
  test("przełącznik języka zachowuje ścieżkę i aktualizuje treść", async ({ page }) => {
    const { settingsPage } = await prepareNewSettingsSession(page);

    await settingsPage.selectLanguage("en");

    await settingsPage.expectLanguage("en");
    await expect(page).toHaveURL(/\/en\/settings$/);
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByText(/Adjust language and theme preferences\./i)).toBeVisible();

    await page.reload();
    await settingsPage.expectLanguage("en");

    await logout(page, "en");
  });
});
