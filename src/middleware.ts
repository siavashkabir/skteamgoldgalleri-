import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import { SESSION_COOKIE, encodeSession, isSessionExpired, parseSession, sessionMaxAge } from "@/lib/session-policy";


const REFRESH_AFTER_MS = 60_000;

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/master-admin" || pathname.startsWith("/master-admin/") || pathname === "/profile" || pathname.startsWith("/profile/");
  if (!isProtectedRoute) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => { request.cookies.set(name, value); });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => { response.cookies.set(name, value, options); });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  if (error && error.status !== 401 && error.name !== "AuthSessionMissingError") throw error;

  const signedIn = !error && typeof data?.claims?.sub === "string";
  if (!signedIn) return response;

  const now = Date.now();
  const session = parseSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session || isSessionExpired(session, now)) {
    await supabase.auth.signOut({ scope: "local" });
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    loginUrl.searchParams.set("expired", "1");
    const redirectResponse = NextResponse.redirect(loginUrl);
    for (const cookie of response.cookies.getAll()) redirectResponse.cookies.set(cookie);
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith("sb-")) redirectResponse.cookies.delete(cookie.name);
    }
    redirectResponse.cookies.delete(SESSION_COOKIE);
    return redirectResponse;
  }

  if (now - session.lastActive > REFRESH_AFTER_MS) {
    response.cookies.set(SESSION_COOKIE, encodeSession(session.remember, now), {
      path: "/", sameSite: "lax", secure: request.nextUrl.protocol === "https:", maxAge: sessionMaxAge(session.remember),
    });
  }

  return response;
}

export const config = { matcher: ["/master-admin/:path*", "/admin/:path*", "/profile/:path*"] };
