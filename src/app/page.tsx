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
