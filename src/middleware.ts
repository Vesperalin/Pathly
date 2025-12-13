import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { createMiddlewareClient } from "@/lib/supabase/server";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware({
  locales: SUPPORTED_LOCALES,
  defaultLocale: "en",
  localePrefix: "always",
});

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createMiddlewareClient(request, response);
    await supabase.auth.getUser();
    return response;
  }

  const intlResponse = intlMiddleware(request);

  const response =
    intlResponse ||
    NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

  const supabase = createMiddlewareClient(request, response);
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Note: API routes are handled separately in the middleware function
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
