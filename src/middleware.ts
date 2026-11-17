import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import { db } from "@/lib/db";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get("host") || "";
  const cleanHostname = hostname.split(":")[0];

  // 🚀 سیستم مسیریابی داینامیک (بدون تغییر آدرس کاربر)
  if ((pathname === "/" || pathname === "") && !cleanHostname.includes("localhost") && !cleanHostname.includes("127.0.0.1")) {
    try {
      const result = await db.execute({
        sql: "SELECT slug FROM tenants WHERE domain = ? LIMIT 1",
        args: [cleanHostname],
      });

      if (result.rows.length > 0) {
        const slug = String(result.rows[0].slug);
        return NextResponse.rewrite(new URL(`/${slug}`, request.url));
      }
    } catch (error) {
      console.error("Domain routing DB error:", error);
    }
  }

  // 🚀 محافظت از صفحات ادمین و پروفایل
  const isProtectedRoute = pathname.startsWith("/admin") || pathname.startsWith("/master-admin") || pathname.startsWith("/profile");
  
  if (!isProtectedRoute) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/master-admin/:path*", "/admin/:path*", "/profile/:path*", "/"],
};
