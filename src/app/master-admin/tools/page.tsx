import Link from "next/link";
import { getSuperAdminContext } from "@/lib/admin-context";
import { db } from "@/lib/db";
import MasterToolsManager, { type MasterTool } from "./tools-manager";

export const dynamic = "force-dynamic";

export default async function MasterToolsPage() {
  await getSuperAdminContext();
  const result = await db.execute(
    'SELECT id, name, url, icon, "order" AS display_order FROM master_tools ORDER BY "order", name',
  );
  const tools: MasterTool[] = result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    url: String(row.url),
    icon: String(row.icon),
    order: Number(row.display_order),
  }));
  return (
    <main className="min-h-screen bg-[#10100f] px-5 py-8 text-[#f5f2e9] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link className="text-sm text-[#d6ad56] hover:text-[#e2c16d]" href="/master-admin">
          ← بازگشت به پنل مدیریت
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">مدیریت ابزارهای من</h1>
        <p className="mt-2 text-sm text-[#969387]">
          پیوندها و ترتیب نمایش ابزارهای پنل مادر را مدیریت کنید.
        </p>
        <MasterToolsManager tools={tools} />
      </div>
    </main>
  );
}
