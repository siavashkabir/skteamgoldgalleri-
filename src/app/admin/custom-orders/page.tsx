import { getTenantAdminContext } from "@/lib/admin-context";
import { db } from "@/lib/db";
import { getSupabaseAdminClient } from "@/lib/supabase";
import Image from "next/image";


type CustomOrder = {
  id: string;
  customerName: string;
  customerId: string;
  customerPhone: string;
  imageUrl: string;
  description: string;
  contactInfo: string;
  status: string;
  createdAt: string;
};

export default async function CustomOrdersPage() {
  const { tenantId } = await getTenantAdminContext();
  const result = await db.execute({
    sql: `SELECT co.id, co.image_url, co.description, co.contact_info,
                 co.status, co.created_at, p.full_name, p.id AS customer_id,
                 p.mobile
          FROM custom_orders co
          JOIN profiles p ON p.id = co.customer_id AND p.tenant_id = co.tenant_id
          WHERE co.tenant_id = ?
          ORDER BY co.created_at DESC`,
    args: [tenantId],
  });

  const orders: CustomOrder[] = await Promise.all(
    result.rows.map(async (row) => {
      const { data: image, error } = await getSupabaseAdminClient().storage
        .from("custom-orders")
        .createSignedUrl(String(row.image_url), 60 * 60);
      if (error) {
        throw error;
      }
      return {
        id: String(row.id),
        customerName: String(row.full_name || "مشتری"),
        customerId: String(row.customer_id),
        customerPhone: String(row.mobile || row.contact_info || "ثبت نشده"),
        imageUrl: image.signedUrl,
        description: String(row.description),
        contactInfo: String(row.contact_info),
        status: String(row.status),
        createdAt: String(row.created_at),
      };
    }),
  );

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold sm:text-3xl">سفارش‌های اختصاصی</h1>
        <p className="mt-2 text-sm text-[#969387]">
          درخواست‌های طراحی ثبت‌شده توسط مشتریان فروشگاه
        </p>
      </div>
      {orders.length ? (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              className="grid gap-5 rounded-2xl border border-white/[0.08] bg-[#171716] p-5 sm:grid-cols-[180px_1fr] sm:p-6"
              key={order.id}
            >
              <a href={order.imageUrl} rel="noreferrer" target="_blank">
                <Image
                  alt={`طرح اختصاصی ${order.customerName}`}
                  className="h-48 w-full rounded-xl object-cover sm:h-44"
                  height={192}
                  unoptimized
                  src={order.imageUrl}
                  width={288}
                />
              </a>
              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{order.customerName}</h2>
                    <p className="mt-1 text-xs text-[#8b897f]" dir="ltr">
                      شناسه مشتری: {order.customerId.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-sm text-[#d8d3c7]" dir="ltr">
                      {order.customerPhone}
                    </p>
                  </div>
                  <span className="rounded-full border border-[#d6ad56]/20 bg-[#d6ad56]/[0.07] px-3 py-1 text-xs text-[#e2c16d]">
                    {translateStatus(order.status)}
                  </span>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#d8d3c7]">
                  {order.description}
                </p>
                <p className="mt-3 text-sm text-[#aaa79b]">
                  اطلاعات تکمیلی: <span dir="auto">{order.contactInfo}</span>
                </p>
                <p className="mt-2 text-xs text-[#77766e]">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#171716] px-6 py-16 text-center">
          <h2 className="font-semibold">درخواستی ثبت نشده است</h2>
          <p className="mt-2 text-sm text-[#969387]">
            سفارش‌های اختصاصی مشتریان در این بخش نمایش داده می‌شوند.
          </p>
        </div>
      )}
    </section>
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(
    new Date(`${value.replace(" ", "T")}Z`),
  );
}
