import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIX = "/portal";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/auth/callback",
  "/stats",
  "/rules",
  "/help",
  "/payment-pending",
  "/unauthorized",
]);

const isStaticAsset = (pathname: string) => {
  // Skip all static assets and Next.js internals
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/_vercel")) return true;
  if (pathname.startsWith("/public")) return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/assets/")) return true;

  // Check file extensions
  const staticExtensions =
    /\.(js|css|map|json|ico|svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot|mp4|webm)$/i;
  return staticExtensions.test(pathname);
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth session refresh for static assets and Next.js internals
  // This prevents unnecessary Supabase API calls
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Refresh session and get user for dynamic routes
  const { supabaseResponse, user } = await updateSession(request);

  // Public paths and auth routes — allow without authentication
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/auth/")) {
    return supabaseResponse;
  }

  // Protected routes — redirect unauthenticated users to login
  if (!user && pathname.startsWith(PROTECTED_PREFIX)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
