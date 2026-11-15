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
  const [products, categories, tenantResult] = await Promise.all([
    db.execute({
      sql: "SELECT COUNT(*) AS count FROM products WHERE tenant_id = ?",
      args: [tenantId],
    }),
    db.execute({
      sql: "SELECT COUNT(*) AS count FROM categories WHERE tenant_id = ?",
      args: [tenantId],
    }),
    db.execute({
      sql: "SELECT status, expiry_date FROM tenants WHERE id = ?",
      args: [tenantId],
    }),
  ]);
  const tenant = tenantResult.rows[0];
  if (!tenant) {
    throw new Error("فروشگاه مرتبط با حساب کاربری پیدا نشد.");
  }
  const status =
    tenant.status === "trial" || tenant.status === "suspended"
      ? tenant.status
      : "active";
  const expiryDate =
    tenant.expiry_date === null ? null : String(tenant.expiry_date);
  const productCount = Number(products.rows[0]?.count ?? 0);
  const categoryCount = Number(categories.rows[0]?.count ?? 0);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[#d6ad56]">نمای کلی فروشگاه</p>
      <h1 className="text-2xl font-semibold sm:text-3xl">{tenantName}</h1>
      <p className="mt-2 text-sm text-[#969387]">
        محصولات و دسته‌بندی‌های فروشگاه خود را از اینجا مدیریت کنید.
      </p>

      <section className="mt-7 rounded-2xl border border-[#d6ad56]/20 bg-gradient-to-br from-[#d6ad56]/[0.09] to-[#171716] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs text-[#aaa79b]">وضعیت اشتراک فروشگاه</p>
            <p className="mt-2 text-lg font-semibold text-[#e2c16d]">
              {status === "active" ? "فعال" : status === "trial" ? "آزمایشی" : "تعلیق‌شده"}
            </p>
            <p className="mt-2 text-xs text-[#969387]">
              {expiryDate
                ? `تاریخ پایان: ${new Intl.DateTimeFormat("fa-IR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${expiryDate}T00:00:00Z`))}`
                : "تاریخ پایان اشتراک ثبت نشده است."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              className="rounded-xl bg-[#d6ad56] px-4 py-3 text-xs font-semibold text-[#211a0d] transition hover:bg-[#e2bf70]"
              href={`https://t.me/share/url?text=${encodeURIComponent(`سلام، برای تمدید اشتراک فروشگاه ${tenantName} راهنمایی می‌خواهم.`)}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              تمدید اشتراک در تلگرام
            </a>
            <a
              className="rounded-xl border border-emerald-400/25 px-4 py-3 text-xs font-medium text-emerald-200 transition hover:bg-emerald-400/[0.08]"
              href={`https://wa.me/?text=${encodeURIComponent(`سلام، برای تمدید اشتراک فروشگاه ${tenantName} راهنمایی می‌خواهم.`)}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              تمدید اشتراک در واتساپ
            </a>
          </div>
        </div>
      </section>

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
          description="مدیریت سفارش‌های ثبت‌شده"
        />
        <DashboardCard
          href="/admin/custom-orders"
          label="سفارش اختصاصی"
          value="مشاهده"
          description="درخواست‌های طراحی اختصاصی مشتریان"
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
