/**
 * Dane testowe dla testów E2E
 */

export const TEST_USERS = {
  valid: {
    email: "test@example.com",
    password: "TestPassword123!",
    displayName: "Test User",
  },
  invalid: {
    email: "invalid@example.com",
    password: "WrongPassword",
  },
};

export const TEST_ROUTES = {
  sampleRoute: {
    name: "Testowa trasa",
    distance: 10.5,
    ascent: 500,
    descent: 450,
    duration: 180, // minutes
    date: "2024-01-15",
    got_points: 15,
  },
};

export const TEST_CATALOGS = {
  favorites: {
    name: "Ulubione trasy",
    description: "Moje najlepsze wędrówki",
  },
};
