import Link from "next/link";
import { getTenantAdminContext } from "@/lib/admin-context";
import { db } from "@/lib/db";

type Customer = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  orderCount: number;
  lastOrderAt: string | null;
};

export default async function CustomersPage() {
  const { tenantId } = await getTenantAdminContext();
  const result = await db.execute({
    sql: `SELECT p.id, p.full_name, p.email, p.mobile,
                 COUNT(DISTINCT o.id) AS order_count,
                 MAX(o.created_at) AS last_order_at
          FROM profiles p
          LEFT JOIN orders o
            ON o.customer_id = p.id AND o.tenant_id = p.tenant_id
          WHERE p.tenant_id = ? AND p.role = 'customer'
          GROUP BY p.id, p.full_name, p.email, p.mobile
          ORDER BY p.full_name, p.email`,
    args: [tenantId],
  });
  const customers: Customer[] = result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.full_name || "مشتری"),
    email: String(row.email || ""),
    mobile: String(row.mobile || ""),
    orderCount: Number(row.order_count),
    lastOrderAt: row.last_order_at === null ? null : String(row.last_order_at),
  }));
  return (
    <section>
      <h1 className="text-2xl font-semibold sm:text-3xl">مشتریان</h1>
      <p className="mt-2 text-sm text-[#969387]">
        مشتریان ثبت‌نام‌شده در فروشگاه شما و سابقه سفارش آن‌ها
      </p>
      {customers.length ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#171716]">
          <table className="w-full min-w-[640px] text-right text-sm">
            <thead className="border-b border-white/[0.07] text-xs text-[#969387]">
              <tr>
                <th className="px-5 py-4 font-medium">نام مشتری</th>
                <th className="px-5 py-4 font-medium">ایمیل</th>
                <th className="px-5 py-4 font-medium">موبایل</th>
                <th className="px-5 py-4 font-medium">تعداد سفارش</th>
                <th className="px-5 py-4 font-medium">تاریخچه</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-5 py-4 font-medium">{customer.name}</td>
                  <td className="px-5 py-4 text-xs text-[#aaa79b]" dir="ltr">{customer.email || "—"}</td>
                  <td className="px-5 py-4 text-xs text-[#aaa79b]" dir="ltr">{customer.mobile || "—"}</td>
                  <td className="px-5 py-4 tabular-nums">{customer.orderCount.toLocaleString("fa-IR")}</td>
                  <td className="px-5 py-4">
                    <Link
                      className="rounded-lg border border-[#d6ad56]/30 px-3 py-2 text-xs text-[#e2c16d] hover:bg-[#d6ad56]/[0.08]"
                      href={`/admin/customers/${encodeURIComponent(customer.id)}`}
                    >
                      مشاهده سفارش‌ها
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-white/[0.08] bg-[#171716] p-8 text-center text-sm text-[#969387]">
          هنوز مشتری‌ای برای این فروشگاه ثبت‌نام نکرده است.
        </p>
      )}
    </section>
  );
}
