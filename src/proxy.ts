import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

const protectedPaths = ["/dashboard", "/cold-call", "/sms", "/history", "/profile", "/billing", "/jaskinia", "/shadow-boxing", "/reminders"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const localePrefix = routing.locales.find(
    (locale) =>
      pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  const pathWithoutLocale = localePrefix
    ? pathname.replace(`/${localePrefix}`, "") || "/"
    : pathname;

  const isProtected = protectedPaths.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/")
  );

  if (isProtected) {
    // In mock mode, always allow through — the layout handles redirect
    if (process.env.NEXT_PUBLIC_DEV_MOCK_AUTH !== "true") {
      const { auth } = await import("@/lib/auth");
      const session = await auth();
      if (!session?.user) {
        const locale = localePrefix ?? routing.defaultLocale;
        const loginUrl = new URL(`/${locale}/login`, request.url);
        loginUrl.searchParams.set("callbackUrl", request.url);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)",
  ],
};
