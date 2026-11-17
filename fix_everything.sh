#!/bin/bash
set -e

echo "🔍 1. در حال اصلاح لینک‌های پنل مستر ادمین..."
for file in src/app/master-admin/*.tsx; do
  if [ -f "$file" ]; then
    # جایگزینی لینک‌های هاردکد شده با دامنه اصلی (تا کلمه skteam تو آدرس نیاد)
    sed -i 's|href={`/${tenant.slug}`}|href={`https://${tenant.domain || "amirgoldglr.ir"}`}|g' "$file" || true
    sed -i 's|href={`/${store.slug}`}|href={`https://${store.domain || "amirgoldglr.ir"}`}|g' "$file" || true
  fi
done
echo "✅ لینک‌های پنل ادمین اصلاح شدند."

echo "🚀 2. در حال بازنویسی page.tsx با منطق داینامیک قوی..."
cat << 'INNER_EOF' > src/app/page.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export default async function Home() {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const cleanHostname = hostname.split(":")[0].toLowerCase();

  if (cleanHostname.includes("localhost") || cleanHostname.includes("127.0.0.1")) {
    redirect("/skteam");
  }

  try {
    const result = await db.execute({
      sql: "SELECT slug FROM tenants WHERE lower(trim(domain)) = ? LIMIT 1",
      args: [cleanHostname],
    });

    if (result.rows.length > 0) {
      const slug = String(result.rows[0].slug);
      redirect(`/${slug}`);
    } else {
      const domainPrefix = cleanHostname.split('.')[0];
      redirect(`/${domainPrefix}`);
    }
  } catch (error) {
    console.error("Domain routing error:", error);
    redirect("/skteam");
  }
}
INNER_EOF
echo "✅ page.tsx اصلاح شد."

echo "🚀 3. در حال بازنویسی middleware.ts با منطق داینامیک قوی..."
cat << 'INNER_EOF' > src/middleware.ts
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
      const result = await db.execute({
        sql: "SELECT slug FROM tenants WHERE lower(trim(domain)) = ? LIMIT 1",
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
INNER_EOF
echo "✅ middleware.ts اصلاح شد."

echo "📦 4. در حال کامیت و پوش به گیت‌هاب..."
git add .
git commit -m "feat: unified fix for dynamic routing and admin links"
git push origin main

echo "🎉 همه کارها با موفقیت انجام شد! کلودفلر در حال دیپلوی است..."
