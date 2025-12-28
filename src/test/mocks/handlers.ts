import { http, HttpResponse } from "msw";

/**
 * MSW Handlers dla testów API
 * Dokumentacja: https://mswjs.io/docs/
 */

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";

export const handlers = [
  // Przykładowy handler dla GET /api/profiles
  http.get(`${BASE_URL}/rest/v1/profiles`, () => {
    return HttpResponse.json([
      {
        id: "1",
        email: "test@example.com",
        display_name: "Test User",
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  // Przykładowy handler dla POST /api/routes
  http.post(`${BASE_URL}/rest/v1/routes`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: "1",
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // Dodaj więcej handlerów według potrzeb
];
