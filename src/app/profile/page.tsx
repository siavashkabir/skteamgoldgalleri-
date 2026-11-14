import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCustomerContext } from "@/lib/admin-context";
import { supabaseAdmin } from "@/lib/supabase";
import { signOut } from "@/app/master-admin/actions";
import { addItemToCart, removeCartItem, saveProfile } from "./actions";
import CustomOrderForm from "./custom-order-form";

type CartRow = {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type CustomOrderRow = {
  id: string;
  imagePath: string;
  description: string;
  status: string;
  createdAt: string;
};

export default function CustomerProfilePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#10100f]" aria-busy="true" />}>
      <CustomerDashboard />
    </Suspense>
  );
}

async function CustomerDashboard() {
  const customer = await getCustomerContext();
  const [cartResult, orderResult, productsResult, customOrdersResult] =
    await Promise.all([
      db.execute({
        sql: `SELECT c.id, p.id AS product_id, p.name, p.price, c.quantity
              FROM cart_items c
              JOIN products p ON p.id = c.product_id AND p.tenant_id = c.tenant_id
              WHERE c.tenant_id = ? AND c.customer_id = ?
              ORDER BY c.created_at DESC`,
        args: [customer.tenantId, customer.userId],
      }),
      db.execute({
        sql: `SELECT id, status, total, created_at FROM orders
              WHERE tenant_id = ? AND customer_id = ?
              ORDER BY created_at DESC`,
        args: [customer.tenantId, customer.userId],
      }),
      db.execute({
        sql: `SELECT id, name, price FROM products
              WHERE tenant_id = ? AND is_visible = 1 ORDER BY name`,
        args: [customer.tenantId],
      }),
      db.execute({
        sql: `SELECT id, image_url, description, status, created_at
              FROM custom_orders
              WHERE tenant_id = ? AND customer_id = ?
              ORDER BY created_at DESC`,
        args: [customer.tenantId, customer.userId],
      }),
    ]);

  const cart: CartRow[] = cartResult.rows.map((row) => ({
    id: String(row.id),
    productId: String(row.product_id),
    name: String(row.name),
    price: Number(row.price),
    quantity: Number(row.quantity),
  }));
  const customOrders: CustomOrderRow[] = await Promise.all(
    customOrdersResult.rows.map(async (row) => {
      const imagePath = String(row.image_url);
      const { data, error } = await supabaseAdmin.storage
        .from("custom-orders")
        .createSignedUrl(imagePath, 60 * 60);
      if (error) {
        throw error;
      }
      return {
        id: String(row.id),
        imagePath: data.signedUrl,
        description: String(row.description),
        status: String(row.status),
        createdAt: String(row.created_at),
      };
    }),
  );

  return (
    <main className="min-h-screen bg-[#10100f] text-[#f5f2e9]">
      <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-8">
        <div>
          <Link className="text-sm font-semibold text-[#e2c16d]" href="/">
            گالری طلای امیر
          </Link>
          <p className="mt-1 text-xs text-[#8b897f]">حساب کاربری من</p>
        </div>
        <form action={signOut}>
          <button className="rounded-lg px-3 py-2 text-sm text-[#aaa79b] hover:bg-white/[0.05]">
            خروج
          </button>
        </form>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-5 py-8 sm:px-8 sm:py-10">
        <section>
          <p className="mb-2 text-sm font-medium text-[#d6ad56]">داشبورد مشتری</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            سلام {customer.fullName || customer.email}
          </h1>
          <p className="mt-2 text-sm text-[#969387]">
            اطلاعات حساب، سبد خرید و سفارش‌های شما
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/[0.07] bg-[#171716] p-5 sm:p-6">
            <h2 className="text-lg font-semibold">اطلاعات شخصی</h2>
            <p className="mt-2 text-sm text-[#969387]" dir="ltr">
              {customer.email}
            </p>
            <form action={saveProfile} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#10100f] px-4 text-sm"
                defaultValue={customer.fullName}
                maxLength={120}
                name="full_name"
                placeholder="نام و نام خانوادگی"
                required
              />
              <button className="h-11 rounded-xl border border-[#d6ad56]/40 px-4 text-sm text-[#e2c16d] hover:bg-[#d6ad56]/10">
                ذخیره نام
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-white/[0.07] bg-[#171716] p-5 sm:p-6">
            <h2 className="text-lg font-semibold">
              سبد خرید <span className="text-sm text-[#8b897f]">({cart.length})</span>
            </h2>
            {cart.length ? (
              <ul className="mt-4 divide-y divide-white/[0.07]">
                {cart.map((item) => (
                  <li className="flex items-center justify-between gap-3 py-3" key={item.id}>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="mt-1 text-xs text-[#969387]">
                        {item.quantity.toLocaleString("fa-IR")} عدد ·{" "}
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <form action={removeCartItem}>
                      <input name="item_id" type="hidden" value={item.id} />
                      <button className="text-xs text-red-300 hover:text-red-200">
                        حذف
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[#8b897f]">سبد خرید شما خالی است.</p>
            )}
            {productsResult.rows.length ? (
              <form action={addItemToCart} className="mt-5 flex gap-2">
                <select
                  className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#10100f] px-3 text-sm"
                  name="product_id"
                  required
                >
                  {productsResult.rows.map((row) => (
                    <option key={String(row.id)} value={String(row.id)}>
                      {String(row.name)} — {formatPrice(Number(row.price))}
                    </option>
                  ))}
                </select>
                <button className="h-11 shrink-0 rounded-xl bg-[#d6ad56] px-4 text-sm font-semibold text-[#211a0d]">
                  افزودن
                </button>
              </form>
            ) : null}
          </article>
        </section>

        <section className="rounded-2xl border border-white/[0.07] bg-[#171716] p-5 sm:p-6">
          <h2 className="text-lg font-semibold">تاریخچه سفارش‌ها</h2>
          {orderResult.rows.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[420px] text-right text-sm">
                <thead className="text-xs text-[#8b897f]">
                  <tr>
                    <th className="py-3 font-medium">شناسه</th>
                    <th className="py-3 font-medium">وضعیت</th>
                    <th className="py-3 font-medium">مبلغ</th>
                    <th className="py-3 font-medium">تاریخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07]">
                  {orderResult.rows.map((row) => (
                    <tr key={String(row.id)}>
                      <td className="py-3 font-mono text-xs text-[#aaa79b]">
                        {String(row.id).slice(0, 8)}
                      </td>
                      <td className="py-3">{translateStatus(String(row.status))}</td>
                      <td className="py-3">{formatPrice(Number(row.total))}</td>
                      <td className="py-3 text-xs text-[#969387]">
                        {formatDate(String(row.created_at))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[#8b897f]">هنوز سفارشی ثبت نشده است.</p>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-[#d6ad56]/20 bg-[#171716] p-5 sm:p-6">
            <h2 className="text-lg font-semibold">سفارش اختصاصی</h2>
            <p className="mb-5 mt-2 text-sm leading-6 text-[#969387]">
              تصویر طرح دلخواه را بفرستید تا کارشناسان گالری با شما تماس بگیرند.
            </p>
            <CustomOrderForm />
          </article>
          <article className="rounded-2xl border border-white/[0.07] bg-[#171716] p-5 sm:p-6">
            <h2 className="text-lg font-semibold">درخواست‌های اختصاصی من</h2>
            {customOrders.length ? (
              <ul className="mt-4 space-y-4">
                {customOrders.map((order) => (
                  <li className="flex gap-4 rounded-xl border border-white/[0.06] p-3" key={order.id}>
                    {/* The signed URL is short-lived; the underlying storage object remains private. */}
                    <Image
                      alt="تصویر طرح سفارش اختصاصی"
                      className="h-20 w-20 rounded-lg object-cover"
                      height={80}
                      unoptimized
                      src={order.imagePath}
                      width={80}
                    />
                    <div className="min-w-0">
                      <p className="text-sm leading-6">{order.description}</p>
                      <p className="mt-1 text-xs text-[#d6ad56]">
                        {translateStatus(order.status)}
                      </p>
                      <p className="mt-1 text-xs text-[#77766e]">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[#8b897f]">
                هنوز درخواست اختصاصی ثبت نکرده‌اید.
              </p>
            )}
          </article>
        </section>
      </div>
    </main>
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
