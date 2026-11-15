import Link from "next/link";
import { getSuperAdminContext } from "@/lib/admin-context";

const stack = [
  ["Next.js", "رندر ویترین، پنل‌ها و Server Actions"],
  ["Turso", "پایگاه داده SQLite ابری برای فروشگاه‌ها، محصولات و سفارش‌ها"],
  ["Supabase", "احراز هویت کاربران و ذخیره‌سازی تصاویر"],
  ["Cloudflare Workers", "میزبانی و اجرای نسخه production برنامه"],
];

const features = [
  "چندفروشگاهی با مدیریت مالک‌محور و پنل جداگانه برای هر فروشگاه",
  "مدیریت محصول، دسته‌بندی، مشتری و سابقه سفارش",
  "قالب‌های ویترین luxury، minimal و classic به‌همراه پوسته قابل تنظیم",
  "اشتراک، وضعیت فروشگاه، بنر سراسری و ابزارهای پنل مادر",
  "ورود امن مدیر کل به پنل فروشگاه برای پشتیبانی",
];

const handover = [
  "در GitHub، مخزن را از Settings → General → Danger Zone به حساب یا سازمان خریدار منتقل کنید؛ مطمئن شوید دسترسی مدیران و قوانین branch هم منتقل شده‌اند.",
  "از Turso نسخه پشتیبان بگیرید. برای انتقال مالکیت، خریدار را به سازمان Turso اضافه کنید یا پایگاه داده را در سازمان او ایجاد و داده‌ها را منتقل کنید؛ اتصال برنامه را به URL و توکن جدید تغییر دهید.",
  "پروژه Supabase را به سازمان خریدار منتقل کنید یا پروژه جدید بسازید. کاربران Auth، تنظیمات redirect، باکت‌های products و custom-orders و سیاست‌های Storage را بررسی کنید.",
  "Worker و دامنه‌های Cloudflare را به حساب خریدار منتقل کنید یا دوباره راه‌اندازی کنید. دامنه سفارشی باید در تنظیمات Custom Domains همان Worker ثبت شود.",
  "در Worker secrets/variables جدید برای Turso و Supabase تنظیم کنید؛ هرگز توکن‌ها یا service-role key را در GitHub نگذارید. دسترسی قبلی را لغو یا کلیدها را rotate کنید.",
  "پس از انتقال، migrationهای مستندشده را اجرا کنید، ورود مالک و مدیر کل، تصاویر، محصولات و گردش ثبت سفارش را آزمایش کنید و پشتیبان تازه تهیه کنید.",
];

export default async function SystemGuidePage() {
  await getSuperAdminContext();
  return (
    <main className="min-h-screen bg-[#10100f] px-5 py-8 text-[#f5f2e9] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link className="text-sm text-[#d6ad56] hover:text-[#e2c16d]" href="/master-admin">
          ← بازگشت به پنل مدیریت
        </Link>
        <p className="mt-7 text-sm font-medium text-[#d6ad56]">مستندات پلتفرم</p>
        <h1 className="mt-2 text-3xl font-semibold">راهنمای سامانه</h1>
        <section className="mt-8 rounded-2xl border border-white/[0.08] bg-[#171716] p-5 sm:p-7">
          <h2 className="text-lg font-semibold">معماری و فناوری‌ها</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {stack.map(([name, description]) => (
              <div className="rounded-xl border border-white/[0.06] p-4" key={name}>
                <dt className="font-medium text-[#e2c16d]">{name}</dt>
                <dd className="mt-2 text-sm leading-6 text-[#aaa79b]">{description}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="mt-6 rounded-2xl border border-white/[0.08] bg-[#171716] p-5 sm:p-7">
          <h2 className="text-lg font-semibold">قابلیت‌های فعال</h2>
          <ul className="mt-4 list-disc space-y-2 pr-5 text-sm leading-7 text-[#c5c1b6]">
            {features.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
        </section>
        <section className="mt-6 rounded-2xl border border-[#d6ad56]/15 bg-[#171716] p-5 sm:p-7">
          <h2 className="text-lg font-semibold">واگذاری پروژه به خریدار</h2>
          <p className="mt-2 text-sm leading-7 text-[#969387]">
            برای فروش یک‌باره، مالکیت مخزن و هر سرویس زیرساختی را با هماهنگی خریدار منتقل کنید؛ تغییر مالکیت به‌تنهایی دسترسی‌ها و secrets را جابه‌جا نمی‌کند.
          </p>
          <ol className="mt-4 list-decimal space-y-3 pr-5 text-sm leading-7 text-[#c5c1b6]">
            {handover.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <Link className="mt-6 inline-flex rounded-xl border border-[#d6ad56]/30 px-4 py-3 text-sm text-[#e2c16d] hover:bg-[#d6ad56]/[0.08]" href="/master-admin/tools">
            مدیریت ابزارهای پنل
          </Link>
        </section>
      </div>
    </main>
  );
}
