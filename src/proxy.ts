import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLocale } from "@/i18n/locales";

export function proxy(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get("locale");
  const normalizedLocale = localeParam?.toLowerCase();

  if (normalizedLocale && isLocale(normalizedLocale)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-active-locale", normalizedLocale);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
