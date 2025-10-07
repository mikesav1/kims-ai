// middleware.ts
import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ➜ BYPASS: lad API-ruter passere direkte
  if (
    pathname.startsWith("/api/chat") ||   // hele chat-API'et (inkl. subpaths)
    pathname.startsWith("/api/tts")  ||   // TTS
    pathname.startsWith("/api/auth") ||   // next-auth
    pathname.startsWith("/api/test-env")  // evt. env-test
  ) {
    return NextResponse.next();
  }

  // Healthcheck (Playwright/Vercel health)
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // --- resten er din normale auth-gate for sider ---
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (!token) {
    const redirectUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
    );
  }

  const isGuest = guestRegex.test(token?.email ?? "");
  if (token && !isGuest && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*", // vi matcher API, men vi bypassert ovenfor
    "/login",
    "/register",
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
