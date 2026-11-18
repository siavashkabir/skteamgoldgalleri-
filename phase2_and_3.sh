#!/bin/bash
set -e

echo "🚀 1. در حال ساخت صفحه لاگین مستقل برای مستر ادمین..."
mkdir -p src/app/master-login
cat << 'INNER_EOF' > src/app/master-login/page.tsx
"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function MasterLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setError("ایمیل یا رمز عبور اشتباه است.");
    
    // چک کردن نقش سوپر ادمین
    if (data.user.app_metadata?.role !== "super_admin") {
       await supabase.auth.signOut();
       return setError("شما دسترسی به پنل مدیریت پلتفرم را ندارید.");
    }
    router.push("/master-admin");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4 rounded-2xl bg-gray-800 p-8 shadow-2xl">
        <h1 className="text-center text-2xl font-bold text-white">ورود به مدیریت پلتفرم (SK Team)</h1>
        {error && <p className="text-center text-sm text-red-400">{error}</p>}
        <input type="email" placeholder="ایمیل مدیر کل" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg bg-gray-700 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500" required />
        <input type="password" placeholder="رمز عبور" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg bg-gray-700 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500" required />
        <button type="submit" className="w-full rounded-lg bg-blue-600 p-3 font-bold text-white hover:bg-blue-700">ورود</button>
      </form>
    </div>
  );
}
INNER_EOF
echo "✅ صفحه لاگین مستقل ساخته شد."

echo "🚀 2. در حال آپدیت Middleware برای هدایت به لاگین مستقل..."
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
      const result = await db.execute({ sql: "SELECT slug FROM tenants WHERE lower(trim(domain)) = ? LIMIT 1", args: [cleanHostname] });
      if (result.rows.length > 0) return NextResponse.rewrite(new URL(`/${result.rows[0].slug}`, request.url));
    } catch (e) { console.error(e); }
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
    
    if (isMasterRoute && session.user.app_metadata?.role !== "super_admin") {
       return NextResponse.redirect(new URL("/master-login", request.url));
    }
    return response;
  }
  return NextResponse.next({ request });
}
export const config = { matcher: ["/master-admin/:path*", "/master-login", "/admin/:path*", "/profile/:path*", "/"] };
INNER_EOF
echo "✅ Middleware آپدیت شد."

echo "🚀 3. در حال ساخت سیستم آیکون‌های شبکه‌های اجتماعی (فوتر)..."
cat << 'INNER_EOF' > fix_social.py
import re, os
path = "src/app/(storefront)/storefront-footer.tsx"
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f: c = f.read()
    
    # پیدا کردن بخش لینک‌های شبکه‌های اجتماعی و جایگزینی با آیکون‌ها
    social_block = re.search(r'\{store\.instagramUrl \|\| store\.whatsappUrl \|\| store\.telegramUrl.*?\}', c, re.DOTALL)
    
    if social_block:
        new_block = '''{(store.instagramUrl || store.whatsappUrl || store.telegramUrl) && (
          <div className="flex items-center justify-center gap-4 mt-6">
            {store.instagramUrl && (
              <a href={store.instagramUrl} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-primary)]/30 bg-black/20 text-[var(--color-text)] transition hover:bg-[var(--color-primary)] hover:text-black">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            )}
            {store.whatsappUrl && (
              <a href={store.whatsappUrl} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-primary)]/30 bg-black/20 text-[var(--color-text)] transition hover:bg-[var(--color-primary)] hover:text-black">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            )}
            {store.telegramUrl && (
              <a href={store.telegramUrl} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-primary)]/30 bg-black/20 text-[var(--color-text)] transition hover:bg-[var(--color-primary)] hover:text-black">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
            )}
          </div>
        )}'''
        c = c.replace(social_block.group(0), new_block)
        with open(path, "w", encoding="utf-8") as f: f.write(c)
        print("✅ آیکون‌های شبکه‌های اجتماعی اضافه شدند.")
INNER_EOF
python3 fix_social.py
rm fix_social.py

echo "📦 در حال کامیت و پوش..."
git add .
git commit -m "feat: master login, social icons, and middleware isolation"
git push origin main

echo "🎉 فاز 2 و 3 (بخش اول) با موفقیت انجام شد! کلودفلر در حال دیپلوی است..."
