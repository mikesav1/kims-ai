// middleware.ts
import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * ➜ Debug: log alle kald ind i middleware
   */
  console.log("➡ Middleware ramte:", pathname);

  /*
   * ➜ Bypass auth for API-chat endpoint (så curl kan ramme direkte)
   */
  if (pathname.startsWith("/api/chat")) {
    // Tjek også at OPENAI_API_KEY findes
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY mangler i miljøvariabler!");
      return NextResponse.json(
        { error: "Server fejl: OPENAI_API_KEY er ikke sat" },
        { status: 500 }
      );
    }

    console.log("✅ Middleware: /api/chat kører, API key er sat");
    return NextResponse.next();
  }

  /*
   * Playwright starter dev-server og kræver 200 status
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

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
    "/api/:path*",
    "/login",
    "/register",
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
