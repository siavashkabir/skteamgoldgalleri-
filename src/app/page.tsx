import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { DEFAULT_STORE_SLUG } from "@/lib/storefront-types";

export default async function Home() {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const cleanHostname = hostname.split(":")[0];

  // اگر در لوکال هاست هستیم، به اسلاگ پیش فرض برو
  if (cleanHostname.includes("localhost") || cleanHostname.includes("127.0.0.1")) {
    redirect(`/${DEFAULT_STORE_SLUG}`);
  }

  try {
    // جستجوی دامنه در دیتابیس Turso
    const result = await db.execute({
      sql: "SELECT slug FROM tenants WHERE domain = ? LIMIT 1",
      args: [cleanHostname],
    });

    if (result.rows.length > 0) {
      const slug = String(result.rows[0].slug);
      redirect(`/${slug}`);
    }
  } catch (error) {
    console.error("Domain routing error in page.tsx:", error);
  }

  // اگر دامنه پیدا نشد، به پیش‌فرض می‌ره
  redirect(`/${DEFAULT_STORE_SLUG}`);
}
