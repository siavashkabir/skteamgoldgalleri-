import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function Home() {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const cleanHostname = hostname.split(":")[0].toLowerCase();

  // 🚀 نقشه دامنه‌ها به اسلاگ فروشگاه
  const domainMap: Record<string, string> = {
    "amirgoldglr.ir": "skteam",
    "www.amirgoldglr.ir": "skteam",
    "originalcar.skteam.ir": "originalcar",
  };

  const slug = domainMap[cleanHostname] || "skteam"; // پیش‌فرض

  redirect(`/${slug}`);
}
