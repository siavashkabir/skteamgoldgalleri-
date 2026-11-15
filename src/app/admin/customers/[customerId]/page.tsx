import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantAdminContext } from "@/lib/admin-context";
import { db } from "@/lib/db";

type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
};

export default async function CustomerOrderHistoryPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const [{ tenantId }, { customerId }] = await Promise.all([
    getTenantAdminContext(),
    params,
  ]);
  const customerResult = await db.execute({
    sql: `SELECT id, full_name, email, mobile FROM profiles
          WHERE id = ? AND tenant_id = ? AND role = 'customer' LIMIT 1`,
    args: [customerId, tenantId],
  });
  const customer = customerResult.rows[0];
  if (!customer) {
    notFound();
  }
  const [ordersResult, itemsResult] = await Promise.all([
    db.execute({
      sql: `SELECT id, status, total, created_at FROM orders
            WHERE customer_id = ? AND tenant_id = ?
            ORDER BY created_at DESC`,
      args: [customerId, tenantId],
    }),
    db.execute({
      sql: `SELECT oi.order_id, oi.quantity, oi.unit_price, p.name
            FROM order_items oi
            LEFT JOIN products p
              ON p.id = oi.product_id AND p.tenant_id = oi.tenant_id
            WHERE oi.customer_id = ? AND oi.tenant_id = ?
            ORDER BY oi.order_id`,
      args: [customerId, tenantId],
    }),
  ]);
  const itemsByOrder = new Map<string, Order["items"]>();
  for (const row of itemsResult.rows) {
    const orderId = String(row.order_id);
    itemsByOrder.set(orderId, [
      ...(itemsByOrder.get(orderId) ?? []),
      {
        name: String(row.name ?? "محصول حذف‌شده"),
        quantity: Number(row.quantity),
        unitPrice: Number(row.unit_price),
      },
    ]);
  }
  const orders: Order[] = ordersResult.rows.map((row) => ({
    id: String(row.id),
    status: String(row.status),
    total: Number(row.total),
    createdAt: String(row.created_at),
    items: itemsByOrder.get(String(row.id)) ?? [],
  }));

  return (
    <section>
      <Link className="text-sm text-[#d6ad56] hover:text-[#e2c16d]" href="/admin/customers">
        ← بازگشت به مشتریان
      </Link>
      <h1 className="mt-5 text-2xl font-semibold sm:text-3xl">
        تاریخچه سفارش {String(customer.full_name || "مشتری")}
      </h1>
      <div className="mt-4 rounded-2xl border border-white/[0.08] bg-[#171716] p-5 text-sm text-[#aaa79b]">
        <p dir="ltr">{String(customer.email || "—")}</p>
        <p className="mt-2" dir="ltr">{String(customer.mobile || "—")}</p>
      </div>
      {orders.length ? (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <article className="rounded-2xl border border-white/[0.08] bg-[#171716] p-5" key={order.id}>
              <div className="flex flex-wrap justify-between gap-3 border-b border-white/[0.07] pb-4">
                <div>
                  <p className="font-medium">سفارش {order.id.slice(0, 8)}</p>
                  <p className="mt-1 text-xs text-[#969387]">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm text-[#e2c16d]">{translateStatus(order.status)}</p>
                  <p className="mt-1 text-xs text-[#aaa79b]">{formatPrice(order.total)}</p>
                </div>
              </div>
              {order.items.length ? (
                <ul className="mt-3 divide-y divide-white/[0.06]">
                  {order.items.map((item, index) => (
                    <li className="flex justify-between gap-4 py-3 text-sm" key={`${order.id}-${index}`}>
                      <span>{item.name} × {item.quantity.toLocaleString("fa-IR")}</span>
                      <span className="shrink-0 text-[#aaa79b]">{formatPrice(item.unitPrice * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-[#969387]">اقلام سفارش ثبت نشده‌اند.</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-white/[0.08] bg-[#171716] p-8 text-center text-sm text-[#969387]">
          این مشتری هنوز سفارشی ثبت نکرده است.
        </p>
      )}
    </section>
  );
}

function formatPrice(value: number): string {
  return `${value.toLocaleString("fa-IR")} تومان`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(
    new Date(`${value.replace(" ", "T")}Z`),
  );
}

function translateStatus(status: string): string {
  return (
    {
      pending: "در انتظار بررسی",
      processing: "در حال انجام",
      completed: "تکمیل‌شده",
      cancelled: "لغوشده",
    }[status] ?? status
  );
}
