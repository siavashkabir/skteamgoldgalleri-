
import Link from "next/link";
import { getTenantAdminContext } from "@/lib/admin-context";
import { db } from "@/lib/db";
import { updateOrderStatus } from "./actions";

type Order = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{ name: string; quantity: number }>;
};

const statuses = [
  { value: "pending", label: "در انتظار بررسی" },
  { value: "processing", label: "در حال انجام" },
  { value: "completed", label: "تکمیل‌شده" },
  { value: "cancelled", label: "لغوشده" },
] as const;

export default async function OrdersPage() {
  const { tenantId } = await getTenantAdminContext();
  const [ordersResult, itemsResult] = await Promise.all([
    db.execute({
      sql: `SELECT id, customer_id, customer_name, customer_phone, status, total, created_at
            FROM orders WHERE tenant_id = ? ORDER BY created_at DESC`,
      args: [tenantId],
    }),
    db.execute({
      sql: `SELECT oi.order_id, oi.quantity, p.name
            FROM order_items oi
            LEFT JOIN products p
              ON p.id = oi.product_id AND p.tenant_id = oi.tenant_id
            WHERE oi.tenant_id = ? ORDER BY oi.order_id`,
      args: [tenantId],
    }),
  ]);
  const itemsByOrder = new Map<string, Order["items"]>();
  for (const row of itemsResult.rows) {
    const orderId = String(row.order_id);
    itemsByOrder.set(orderId, [
      ...(itemsByOrder.get(orderId) ?? []),
      { name: String(row.name ?? "محصول حذف‌شده"), quantity: Number(row.quantity) },
    ]);
  }
  const orders: Order[] = ordersResult.rows.map((row) => ({
    id: String(row.id),
    customerId: String(row.customer_id),
    customerName: String(row.customer_name || "مشتری"),
    customerPhone: String(row.customer_phone || ""),
    status: String(row.status),
    total: Number(row.total),
    createdAt: String(row.created_at),
    items: itemsByOrder.get(String(row.id)) ?? [],
  }));

  return (
    <section>
      <h1 className="text-2xl font-semibold sm:text-3xl">سفارش‌ها</h1>
      <p className="mt-2 text-sm text-[#969387]">مشاهده و به‌روزرسانی سفارش‌های فروشگاه</p>
      {orders.length ? (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <article className="rounded-2xl border border-white/[0.08] bg-[#171716] p-5" key={order.id}>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.07] pb-4">
                <div>
                  <p className="font-medium">سفارش {order.id.slice(0, 8)}</p>
                  <p className="mt-1 text-xs text-[#969387]">{formatDate(order.createdAt)}</p>
                  <Link
                    className="mt-2 inline-block text-sm text-[#e2c16d] hover:text-[#f1d98e]"
                    href={`/admin/customers/${encodeURIComponent(order.customerId)}`}
                  >
                    {order.customerName}
                  </Link>
                  {order.customerPhone ? (
                    <a className="mr-3 text-xs text-[#aaa79b]" dir="ltr" href={`tel:${encodeURIComponent(order.customerPhone)}`}>
                      {order.customerPhone}
                    </a>
                  ) : null}
                </div>
                <div className="text-left">
                  <p className="text-sm text-[#e2c16d]">{translateStatus(order.status)}</p>
                  <p className="mt-1 text-xs text-[#aaa79b]">{formatPrice(order.total)}</p>
                </div>
              </div>
              {order.items.length ? (
                <ul className="mt-3 divide-y divide-white/[0.06]">
                  {order.items.map((item, index) => (
                    <li className="py-2 text-sm text-[#d8d5ca]" key={`${order.id}-${index}`}>
                      {item.name} × {item.quantity.toLocaleString("fa-IR")}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-[#969387]">اقلام سفارش ثبت نشده‌اند.</p>
              )}
              <form action={updateOrderStatus} className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-4">
                <input name="order_id" type="hidden" value={order.id} />
                <label className="text-xs text-[#aaa79b]" htmlFor={`status-${order.id}`}>وضعیت سفارش</label>
                <select
                  className="rounded-lg border border-white/[0.12] bg-[#10100f] px-3 py-2 text-sm text-white"
                  defaultValue={order.status}
                  id={`status-${order.id}`}
                  name="status"
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
                <button className="rounded-lg border border-[#d6ad56]/30 px-4 py-2 text-sm text-[#e2c16d] transition hover:bg-[#d6ad56]/[0.08]" type="submit">
                  ذخیره وضعیت
                </button>
              </form>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-white/[0.08] bg-[#171716] p-8 text-center text-sm text-[#969387]">
          هنوز سفارشی برای این فروشگاه ثبت نشده است.
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
  return statuses.find((item) => item.value === status)?.label ?? status;
}
