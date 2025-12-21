import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { createMiddlewareClient } from "@/lib/supabase/server";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware({
  locales: SUPPORTED_LOCALES,
  defaultLocale: "en",
  localePrefix: "always",
});

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/login", "/register"];

// Helper to extract locale from pathname
function extractLocale(pathname: string): { locale: string; pathWithoutLocale: string } {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (SUPPORTED_LOCALES.includes(firstSegment as (typeof SUPPORTED_LOCALES)[number])) {
    return {
      locale: firstSegment,
      pathWithoutLocale: `/${segments.slice(1).join("/")}`,
    };
  }

  return {
    locale: "en",
    pathWithoutLocale: pathname,
  };
}

// Check if path is public
function isPublicPath(pathWithoutLocale: string): boolean {
  return PUBLIC_PATHS.some(
    (publicPath) => pathWithoutLocale === publicPath || pathWithoutLocale.startsWith(`${publicPath}/`)
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle API routes - refresh session only
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

  // Apply next-intl middleware first
  const intlResponse = intlMiddleware(request);

  const response =
    intlResponse ||
    NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

  // Refresh Supabase session
  const supabase = createMiddlewareClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Extract locale and path
  const { locale, pathWithoutLocale } = extractLocale(pathname);
  const isPublic = isPublicPath(pathWithoutLocale);

  // Redirect logic
  if (!user && !isPublic) {
    // User not authenticated, trying to access private route -> redirect to login
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isPublic) {
    // User authenticated, trying to access public auth pages -> redirect to dashboard
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

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
