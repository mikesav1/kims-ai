// middleware.ts
import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Debug: se hvad der rammer middleware
  console.log("➡ Middleware ramte:", pathname);

  /**
   * 1) Tillad /api/chat uden login (curl/klienter må kunne kalde direkte)
   *    + valider at OPENAI_API_KEY er sat, ellers 500
   */
  if (pathname.startsWith("/api/chat")) {
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY mangler i miljøvariabler!");
      return NextResponse.json(
        { error: "Server fejl: OPENAI_API_KEY er ikke sat" },
        { status: 500 }
      );
    }
    console.log("✅ /api/chat tilladt (API key er sat)");
    return NextResponse.next();
  }

  /**
   * 2) NYT: Tillad /api/tts (POST fra klient) og /api/test-env (valgfrit)
   *    UDEN at blive omdirigeret til guest-login (undgår 307/405).
   */
  if (
    pathname.startsWith("/api/tts") ||
    pathname.startsWith("/api/test-env")
  ) {
    console.log("✅ Whitelistet endpoint:", pathname);
    return NextResponse.next();
  }

  /**
   * 3) Healthcheck for Playwright/dev
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  /**
   * 4) Lad NextAuth egne endpoints passere
   */
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  /**
   * 5) Normal auth-gate for resten (forside, chat-view, mm.)
   */
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (!token) {
    const redirectUrl = encodeURIComponent(request.url);
    console.log("↪️ Ikke logget ind – redirect til guest-login");
    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
    );
  }

  /**
   * 6) Hvis man allerede er logget ind (ikke-guest), så hold login/register lukket
   */
  const isGuest = guestRegex.test(token?.email ?? "");
  if (token && !isGuest && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

/**
 * Matcher: midlertidigt på næsten alt (inkl. /api/*), så vi kan whiteliste
 * specifikke endpoints inde i middleware-funktionen.
 */
export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
