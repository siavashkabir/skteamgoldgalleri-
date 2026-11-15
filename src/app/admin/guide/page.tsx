import Link from "next/link";
import { getTenantAdminContext } from "@/lib/admin-context";

const canDo = [
  "افزودن، ویرایش و مدیریت موجودی و مشخصات محصولات",
  "ساخت دسته‌بندی و سازمان‌دهی محصولات",
  "مشاهده سفارش‌ها و درخواست‌های اختصاصی مشتریان",
  "مشاهده فهرست مشتریان و تاریخچه سفارش‌های هر مشتری",
  "ویرایش اطلاعات تماس، نشانی و شبکه‌های اجتماعی",
  "مدیریت درخواست‌های رزرو (در صورت فعال بودن ماژول رزرو یا گردشگری)",
];

const cannotDo = [
  "تغییر رنگ‌ها، تصویر پس‌زمینه یا قالب ویترین",
  "تغییر دامنه فروشگاه یا اطلاعات اشتراک",
  "مدیریت فروشگاه‌ها یا ابزارهای پنل مادر",
];

export default async function TenantGuidePage() {
  const context = await getTenantAdminContext();
  const hasEcommerce =
    context.role === "super_admin" ||
    context.enabledModules.includes("ecommerce");
  const hasBookings =
    context.role === "super_admin" ||
    context.enabledModules.includes("booking") ||
    context.enabledModules.includes("tourism");
  const destination = hasEcommerce
    ? "/admin/products"
    : hasBookings
      ? "/admin/bookings"
      : "/admin/settings";
  return (
    <section className="max-w-3xl">
      <p className="text-sm font-medium text-[#d6ad56]">راهنمای فروشگاه</p>
      <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">امکانات پنل مدیریت</h1>
      <p className="mt-3 text-sm leading-7 text-[#969387]">
        این پنل برای مدیریت روزمره محصولات و سفارش‌های فروشگاه شما طراحی شده است.
      </p>
      <div className="mt-7 grid gap-5">
        <article className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-5 sm:p-6">
          <h2 className="font-semibold text-emerald-200">چه کارهایی می‌توانید انجام دهید؟</h2>
          <ul className="mt-4 list-disc space-y-2 pr-5 text-sm leading-6 text-[#d8d3c7]">
            {canDo.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
        <article className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-5 sm:p-6">
          <h2 className="font-semibold text-amber-100">چه چیزهایی در اختیار پنل مادر است؟</h2>
          <ul className="mt-4 list-disc space-y-2 pr-5 text-sm leading-6 text-[#d8d3c7]">
            {cannotDo.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
      </div>
      <Link className="mt-6 inline-flex rounded-xl bg-[#d6ad56] px-4 py-3 text-sm font-semibold text-[#211a0d]" href={destination}>
        {hasEcommerce ? "رفتن به مدیریت محصولات" : hasBookings ? "مدیریت درخواست‌های رزرو" : "تنظیمات فروشگاه"}
      </Link>
    </section>
  );
}
