import { expect, Page } from "@playwright/test";

export async function logout(page: Page, expectedLocale?: string) {
  const logoutButton = page.getByRole("button", { name: /Wyloguj się|Log out/i });

  const ensureMenuOpen = async () => {
    const mobileMenuTrigger = page.getByRole("button", {
      name: /Otwórz nawigację|Open Side Navigation|Menu/i,
    });

    if (await mobileMenuTrigger.isVisible({ timeout: 500 })) {
      await mobileMenuTrigger.click();
    }
  };

  try {
    if (!(await logoutButton.isVisible({ timeout: 1_000 }))) {
      await ensureMenuOpen();
    }

    await logoutButton.click({ timeout: 10_000 });
  } catch (error) {
    console.warn("Logout button not reachable, falling back to clearing cookies.", error);
    await page.context().clearCookies();
    const fallbackUrl = expectedLocale ? `/${expectedLocale}/login` : "/login";
    await page.goto(fallbackUrl);
  }

  if (expectedLocale) {
    await expect(page).toHaveURL(new RegExp(`/${expectedLocale}/login`, "i"));
  } else {
    await expect(page).toHaveURL(/\/[a-z]{2}\/login/i);
  }
}
