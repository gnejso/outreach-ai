import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DASHBOARD_PATHS = [
  "dashboard", "cold-call", "sms", "scraper", "reminders",
  "jaskinia", "shadow-boxing", "oferta", "history", "profile", "billing", "audyt",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Match /<locale>/<dashboard-path>
  const parts = pathname.split("/");
  const locale = parts[1] || "pl";
  const section = parts[2];

  if (DASHBOARD_PATHS.includes(section)) {
    // Check for NextAuth session cookie
    const sessionToken =
      req.cookies.get("__Secure-next-auth.session-token")?.value ||
      req.cookies.get("next-auth.session-token")?.value;

    if (!sessionToken) {
      const loginUrl = new URL(`/${locale}/login`, req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
