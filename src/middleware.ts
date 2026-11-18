import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import { db } from "@/lib/db";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get("host") || "";
  const cleanHostname = hostname.split(":")[0].toLowerCase();

  if ((pathname === "/" || pathname === "") && !cleanHostname.includes("localhost") && !cleanHostname.includes("127.0.0.1")) {
    try {
      const result = await db.execute({ sql: "SELECT slug FROM tenants WHERE lower(trim(domain)) = ? LIMIT 1", args: [cleanHostname] });
      if (result.rows.length > 0) {
        return NextResponse.rewrite(new URL(`/${result.rows[0].slug}`, request.url));
      }
    } catch (e) { console.error("Domain routing error:", e); }
  }

  const isMasterRoute = pathname.startsWith("/master-admin");
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/profile");
  
  if (isMasterRoute || isAdminRoute) {
    let response = NextResponse.next({ request });
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); },
      },
    });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = isMasterRoute ? "/master-login" : "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }
  return NextResponse.next({ request });
}

export const config = { matcher: ["/master-admin/:path*", "/master-login", "/admin/:path*", "/profile/:path*", "/"] };