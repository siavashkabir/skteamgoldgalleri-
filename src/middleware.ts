import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get("host") || "";

  // اگر کاربر در روت اصلی است و وارد یک دامنه شده (نه localhost)
  if ((pathname === "/" || pathname === "") && !hostname.includes("localhost")) {
    // 1. ایجاد کلاینت Supabase برای خواندن دیتابیس
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

    // 2. جستجوی دامنه در دیتابیس
    // فرض بر این است که ستون دامنه در جدول stores اسمش domain است
    const { data: store } = await supabase
      .from("stores")
      .select("slug")
      .eq("domain", hostname)
      .single();

    // 3. اگر فروشگاهی با این دامنه پیدا شد، ریدایرکت کن
    if (store && store.slug) {
      return NextResponse.redirect(new URL(`/${store.slug}`, request.url));
    }
  }

  const hostname = request.headers.get("host") || "";

  // 1. تشخیص دامنه لوازم یدکی (اگر آدرس دامنه originalcar بود و توی مسیر اصلی بودیم)
  if (hostname.includes("originalcar.skteam.ir") && pathname === "/") {
    return NextResponse.redirect(new URL("/originalcar", request.url));
  }

  // 2. تشخیص دامنه طلا (اگر آدرس دامنه اصلی بود و توی مسیر اصلی بودیم)
  if (hostname.includes("amirgoldglr.ir") && pathname === "/") {
    return NextResponse.redirect(new URL("/skteam", request.url));
  }

  const isProtectedRoute = pathname.startsWith("/admin") || pathname.startsWith("/master-admin") || pathname.startsWith("/profile");
  const isProtectedRoute = pathname.startsWith("/admin") || pathname.startsWith("/master-admin") || pathname.startsWith("/profile");
  if (!isProtectedRoute) return NextResponse.next({ request });

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

export const config = { matcher: ["/master-admin/:path*", "/admin/:path*", "/profile/:path*"] };
