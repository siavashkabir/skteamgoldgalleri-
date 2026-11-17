import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export default async function Home() {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const cleanHostname = hostname.split(":")[0];

  // برای لوکال هاست
  if (cleanHostname.includes("localhost") || cleanHostname.includes("127.0.0.1")) {
    redirect("/skteam");
  }

  try {
    const result = await db.execute({
      sql: "SELECT slug FROM tenants WHERE domain = ? LIMIT 1",
      args: [cleanHostname],
    });

    if (result.rows.length > 0) {
      const slug = String(result.rows[0].slug);
      redirect(`/${slug}`);
    } else {
      // 🚨 اگر دامنه پیدا نشد، به جای /skteam به یه صفحه خطا برو
      redirect("/not-found-domain");
    }
  } catch (error) {
    console.error("Domain routing error in page.tsx:", error);
    redirect("/not-found-domain");
  }
}
