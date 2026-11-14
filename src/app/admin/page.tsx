import Link from "next/link";
import { Suspense } from "react";
import { getTenantAdminContext } from "@/lib/admin-context";
import { db } from "@/lib/db";

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="h-72 animate-pulse rounded-3xl bg-white/[0.03]" />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const { tenantId, tenantName } = await getTenantAdminContext();
  const [products, categories] = await Promise.all([
    db.execute({
      sql: "SELECT COUNT(*) AS count FROM products WHERE tenant_id = ?",
      args: [tenantId],
    }),
    db.execute({
      sql: "SELECT COUNT(*) AS count FROM categories WHERE tenant_id = ?",
      args: [tenantId],
    }),
  ]);
  const productCount = Number(products.rows[0]?.count ?? 0);
  const categoryCount = Number(categories.rows[0]?.count ?? 0);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[#d6ad56]">نمای کلی فروشگاه</p>
      <h1 className="text-2xl font-semibold sm:text-3xl">{tenantName}</h1>
      <p className="mt-2 text-sm text-[#969387]">
        محصولات و دسته‌بندی‌های فروشگاه خود را از اینجا مدیریت کنید.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardCard
          href="/admin/products"
          label="محصولات"
          value={productCount.toLocaleString("fa-IR")}
          description="محصولات ثبت‌شده در فروشگاه"
        />
        <DashboardCard
          href="/admin/categories"
          label="دسته‌بندی‌ها"
          value={categoryCount.toLocaleString("fa-IR")}
          description="دسته‌بندی‌های اصلی و زیرمجموعه"
        />
        <DashboardCard
          href="/admin/orders"
          label="سفارش‌ها"
          value="—"
          description="مدیریت سفارش‌ها به‌زودی"
        />
      </section>

      <section className="mt-8 rounded-2xl border border-[#d6ad56]/15 bg-[#d6ad56]/[0.04] p-5 sm:p-6">
        <h2 className="font-semibold">شروع سریع</h2>
        <p className="mt-2 text-sm leading-7 text-[#aaa79b]">
          ابتدا دسته‌بندی‌های فروشگاه را بسازید، سپس محصولات را با تصویر و
          مشخصات کامل اضافه کنید.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <QuickLink href="/admin/categories">مدیریت دسته‌بندی‌ها</QuickLink>
          <QuickLink href="/admin/products">افزودن محصول</QuickLink>
          <QuickLink href="/admin/settings">تنظیمات فروشگاه</QuickLink>
        </div>
      </section>
    </div>
  );
}

function DashboardCard({
  href,
  label,
  value,
  description,
}: {
  href: string;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Link
      className="rounded-2xl border border-white/[0.07] bg-[#171716] p-5 transition hover:border-[#d6ad56]/30"
      href={href}
    >
      <p className="text-sm text-[#aaa79b]">{label}</p>
      <p className="mt-4 text-3xl font-semibold">{value}</p>
      <p className="mt-3 text-xs text-[#77766e]">{description}</p>
    </Link>
  );
}

function QuickLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      className="rounded-lg border border-white/[0.09] px-3 py-2 text-xs text-[#ddd7c8] transition hover:border-[#d6ad56]/40"
      href={href}
    >
      {children}
    </Link>
  );
}
