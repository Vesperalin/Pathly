import type { Page } from "@playwright/test";
import { DashboardPage } from "../pages/dashboard.page";
import { LoginPage } from "../pages/login.page";
import { RegisterPage } from "../pages/register.page";
import { getNewUserEmailPrefix, getNewUserPassword } from "./env";

export interface TestUserCredentials {
  email: string;
  password: string;
}

const DEFAULT_EMAIL_DOMAIN = "mailinator.com";

export function buildUniqueEmail(label: string) {
  const prefix = getNewUserEmailPrefix();
  const salt = Math.random().toString(36).slice(2, 6);
  return `${prefix}+${label}-${Date.now()}-${salt}@${DEFAULT_EMAIL_DOMAIN}`;
}

export async function registerTestUser(page: Page, locale: string, label: string) {
  const credentials = {
    email: buildUniqueEmail(label),
    password: getNewUserPassword(),
  };

  const registerPage = new RegisterPage(page);

  await registerPage.goto(locale);

  // Submit registration form and wait for client-side navigation to dashboard
  // Using waitForNavigation instead of waitForURL to be more flexible
  await Promise.all([
    page.waitForURL((url) => url.pathname.includes(`/${locale}/dashboard`), {
      timeout: 60_000,
    }),
    registerPage.register(credentials.email, credentials.password),
  ]);

  // Wait for dashboard content to load
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.waitForContent();

  return credentials;
}

export async function loginTestUser(page: Page, credentials: TestUserCredentials, locale: string) {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await loginPage.goto(locale);
  await loginPage.login(credentials.email, credentials.password);
  await dashboardPage.goto(locale);
  await dashboardPage.waitForContent();

  return { dashboardPage };
}
