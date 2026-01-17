export interface UserCredentials {
  email: string;
  password: string;
}

export function getPrimaryCredentialsOrSkip(): UserCredentials {
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error("Wymagane zmienne E2E_USERNAME / E2E_PASSWORD nie są ustawione.");
  }

  return { email, password };
}

export function getPrimaryUserId(): string | null {
  return process.env.E2E_USERNAME_ID ?? null;
}

export function getNewUserEmailPrefix(): string {
  return process.env.E2E_NEW_USER_EMAIL_PREFIX ?? "pathly.e2e";
}

export function getNewUserPassword(): string {
  return process.env.E2E_NEW_USER_PASSWORD ?? "TestPassword123!";
}
