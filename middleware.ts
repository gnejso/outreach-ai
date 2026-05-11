import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;

  // Check if it's a dashboard route (any locale)
  const isDashboard = /^\/[a-z]{2}\/(dashboard|cold-call|sms|scraper|reminders|jaskinia|shadow-boxing|oferta|history|profile|billing|audyt)/.test(pathname);

  if (isDashboard && !(req as unknown as { auth: { user?: unknown } }).auth?.user) {
    const locale = pathname.split("/")[1] || "pl";
    const loginUrl = new URL(`/${locale}/login`, req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
