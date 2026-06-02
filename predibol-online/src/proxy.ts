import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIX = "/portal";

const PUBLIC_PATHS = new Set(["/", "/login", "/auth/callback", "/rules"]);

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Allow public paths without authentication
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/auth/")) {
    return supabaseResponse;
  }

  // Allow static assets and Next.js internal routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/assets") ||
    /\.\w+$/.test(pathname)
  ) {
    return supabaseResponse;
  }

  // Redirect unauthenticated users to login
  if (!user && pathname.startsWith(PROTECTED_PREFIX)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
