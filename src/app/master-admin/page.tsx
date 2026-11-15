import { Suspense } from "react";
import { db } from "@/lib/db";
import { getSuperAdminContext } from "@/lib/admin-context";
import {
  DEFAULT_STORE_SLUG,
  DEFAULT_TENANT_ID,
} from "@/lib/storefront-types";
import AddTenantDialog from "./add-tenant-dialog";
import EditTenantDialog from "./edit-tenant-dialog";
import PlatformSettingsForm from "./platform-settings-form";
import { signOut } from "./actions";
import Link from "next/link";
import { parseThemeSettings, type ThemeSettings } from "@/lib/theme-settings";

export const dynamic = "force-dynamic";

type Tenant = {
  id: string;
  name: string;
  domain: string | null;
  createdAt: string;
  description: string;
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  phoneNumbers: string;
  addressText: string;
  locationUrl: string;
  instagramUrl: string;
  telegramUrl: string;
  whatsappUrl: string;
  tomanRate: string;
  themeSettings: ThemeSettings;
};

export default function MasterAdminPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#10100f]" />}>
      <MasterAdminContent />
    </Suspense>
  );
}

async function MasterAdminContent() {
  const { email: accountEmail } = await getSuperAdminContext();

  const [result, platformResult] = await Promise.all([
    db.execute(`SELECT id, name, domain, created_at, description, logo_url, hero_title,
                       hero_subtitle, phone_numbers, address_text, location_url,
                       instagram_url, telegram_url, whatsapp_url, toman_rate,
                       theme_settings
                FROM tenants ORDER BY created_at DESC`),
    db.execute("SELECT key, value FROM platform_settings"),
  ]);
  const platformSettings = new Map(
    platformResult.rows.map((row) => [String(row.key), String(row.value)]),
  );
  const tenants: Tenant[] = result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    domain: row.domain === null ? null : String(row.domain),
    createdAt: String(row.created_at),
    description: row.description === null ? "" : String(row.description),
    logoUrl: row.logo_url === null ? "" : String(row.logo_url),
    heroTitle: row.hero_title === null ? "" : String(row.hero_title),
    heroSubtitle: row.hero_subtitle === null ? "" : String(row.hero_subtitle),
    phoneNumbers: parsePhoneNumbers(row.phone_numbers).join("\n"),
    addressText: row.address_text === null ? "" : String(row.address_text),
    locationUrl: row.location_url === null ? "" : String(row.location_url),
    instagramUrl: row.instagram_url === null ? "" : String(row.instagram_url),
    telegramUrl: row.telegram_url === null ? "" : String(row.telegram_url),
    whatsappUrl: row.whatsapp_url === null ? "" : String(row.whatsapp_url),
    tomanRate: row.toman_rate === null ? "" : String(row.toman_rate),
    themeSettings: parseThemeSettings(row.theme_settings),
  }));
  return (
    <div className="min-h-screen bg-[#10100f] text-[#f5f2e9]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] shrink-0 flex-col border-l border-white/[0.07] bg-[#151514] px-5 py-7 lg:flex">
          <Link className="mb-12 flex items-center gap-3 px-2" href="/master-admin">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e2c16d]/30 bg-[#d6ad56]/10 text-xl font-semibold text-[#e2c16d]">
              ت
            </span>
            <span>
              <span className="block text-sm font-semibold">پنل مدیریت مادر</span>
              <span className="mt-1 block text-[10px] tracking-[0.18em] text-[#77766e]">
                SK TEAM PLATFORM
              </span>
            </span>
          </Link>

          <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.16em] text-[#77766e]">
            فضای مدیریت
          </p>
          <nav aria-label="منوی اصلی" className="space-y-1">
            <a
              className="flex items-center gap-3 rounded-xl bg-[#d6ad56]/[0.10] px-3 py-3 text-sm font-medium text-[#e2c16d]"
              href="#overview"
            >
              <DashboardIcon />
              نمای کلی
            </a>
            <a
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#9c9a90] transition hover:bg-white/[0.04] hover:text-[#f5f2e9]"
              href="#tenants"
            >
              <StoreIcon />
              فروشگاه‌ها
            </a>
          </nav>

          <div className="mt-auto rounded-2xl border border-[#d6ad56]/10 bg-[#d6ad56]/[0.04] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#d6ad56]/10 text-[#d6ad56]">
              <ShieldIcon />
            </div>
            <p className="text-xs font-medium text-[#e8dfc7]">
              فضای مدیریت مرکزی
            </p>
            <p className="mt-1.5 text-[11px] leading-5 text-[#898578]">
              همه فروشگاه‌ها را از یک پنل بررسی کنید.
            </p>
          </div>

          <form action={signOut} className="mt-5">
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#9c9a90] transition hover:bg-white/[0.04] hover:text-[#f5f2e9]">
              <LogoutIcon />
              خروج از حساب
            </button>
          </form>
        </aside>

        <main className="min-w-0 flex-1" id="overview">
          <header className="flex min-h-[76px] items-center justify-between border-b border-white/[0.07] px-5 sm:px-8 lg:px-10">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e2c16d]/25 bg-[#d6ad56]/10 text-lg font-semibold text-[#e2c16d] lg:hidden">
                ت
              </span>
              <div>
                <p className="text-sm font-semibold text-[#e9e5db]">
                  پنل مدیریت
                </p>
                <p className="mt-1 text-[11px] text-[#77766e]">
                  مدیریت یکپارچه فروشگاه‌ها
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-left text-xs text-[#9c9a90] sm:block">
                {accountEmail}
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d6ad56]/25 bg-[#d6ad56]/10 text-sm font-semibold text-[#e2c16d]">
                {accountEmail.slice(0, 1).toLocaleUpperCase("fa-IR")}
              </span>
              <form action={signOut} className="lg:hidden">
                <button
                  aria-label="خروج از حساب"
                  className="rounded-lg p-2 text-[#969387] transition hover:bg-white/[0.05] hover:text-white"
                >
                  <LogoutIcon />
                </button>
              </form>
            </div>
          </header>

          <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
            <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2.5 text-xs font-medium text-[#d6ad56]">
                  {new Intl.DateTimeFormat("fa-IR", {
                    dateStyle: "full",
                  }).format(new Date())}
                </p>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  نمای کلی
                </h1>
                <p className="mt-2 text-sm text-[#929085]">
                  وضعیت فروشگاه‌های متصل به پنل خود را بررسی کنید.
                </p>
              </div>
              <AddTenantDialog />
            </section>

            <section
              aria-label="آمار کلی"
              className="mb-8 grid gap-4 sm:grid-cols-2"
            >
              <article className="rounded-2xl border border-white/[0.07] bg-[#171716] p-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#99978c]">
                      فروشگاه‌های ثبت‌شده
                    </p>
                    <p className="mt-4 text-3xl font-semibold tabular-nums">
                      {tenants.length.toLocaleString("fa-IR")}
                    </p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d6ad56]/[0.10] text-[#d6ad56]">
                    <StoreIcon />
                  </span>
                </div>
                <p className="mt-4 text-xs text-[#77766e]">
                  تعداد کل فروشگاه‌های ثبت‌شده در سامانه
                </p>
              </article>
              <article className="rounded-2xl border border-white/[0.07] bg-[#171716] p-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#99978c]">پایگاه داده</p>
                    <p className="mt-4 text-2xl font-semibold">Turso</p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/[0.08] text-emerald-300">
                    <DatabaseIcon />
                  </span>
                </div>
                <p className="mt-4 text-xs text-[#77766e]">
                  اطلاعات فروشگاه‌ها از پایگاه داده خوانده می‌شود
                </p>
              </article>
            </section>

            <section aria-labelledby="platform-settings-heading">
              <h2 className="mb-3 text-base font-semibold" id="platform-settings-heading">
                برند پلتفرم در فوتر فروشگاه‌ها
              </h2>
              <PlatformSettingsForm
                name={platformSettings.get("platform_name") ?? "SK Team"}
                url={platformSettings.get("platform_url") || "https://skteam.ir"}
              />
            </section>

            <section
              className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#171716]"
              id="tenants"
            >
              <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                <div>
                  <h2 className="text-base font-semibold">فروشگاه‌ها</h2>
                  <p className="mt-1.5 text-xs text-[#858378]">
                    فهرست فروشگاه‌های ثبت‌شده در سامانه
                  </p>
                </div>
                <span className="w-fit rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-xs text-[#aaa79b]">
                  {tenants.length.toLocaleString("fa-IR")} فروشگاه
                </span>
              </div>

              {tenants.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-right text-sm">
                    <thead className="bg-white/[0.02] text-xs text-[#858378]">
                      <tr>
                        <th className="px-6 py-4 font-medium">نام فروشگاه</th>
                        <th className="px-6 py-4 font-medium">دامنه</th>
                        <th className="px-6 py-4 font-medium">تاریخ ثبت</th>
                        <th className="px-6 py-4 font-medium">شناسه</th>
                        <th className="px-6 py-4 font-medium">سایت</th>
                        <th className="px-6 py-4 font-medium">تنظیمات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.055]">
                      {tenants.map((tenant) => (
                        <tr
                          className="transition hover:bg-white/[0.018]"
                          key={tenant.id}
                        >
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d6ad56]/15 bg-[#d6ad56]/[0.07] text-sm font-semibold text-[#d6ad56]">
                                {tenant.name.slice(0, 1)}
                              </span>
                              <span className="font-medium text-[#e8e5dc]">
                                {tenant.name}
                              </span>
                            </span>
                          </td>
                          <td
                            className="px-6 py-4 text-left text-xs text-[#aaa79b]"
                            dir="ltr"
                          >
                            {tenant.domain || "—"}
                          </td>
                          <td className="px-6 py-4 text-xs text-[#aaa79b]">
                            {formatDate(tenant.createdAt)}
                          </td>
                          <td
                            className="px-6 py-4 font-mono text-[11px] text-[#77766e]"
                            dir="ltr"
                            title={tenant.id}
                          >
                            {tenant.id.slice(0, 8)}
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              className="inline-flex whitespace-nowrap rounded-lg border border-[#d6ad56]/30 px-3 py-2 text-xs font-medium text-[#e2c16d] transition hover:bg-[#d6ad56]/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e2bf70]"
                              href={`/${tenant.id === DEFAULT_TENANT_ID ? DEFAULT_STORE_SLUG : tenant.id}`}
                            >
                              مشاهده سایت
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <EditTenantDialog tenant={tenant} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center px-6 py-16 text-center">
                  <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d6ad56]/15 bg-[#d6ad56]/[0.07] text-[#d6ad56]">
                    <StoreIcon />
                  </span>
                  <h3 className="text-sm font-semibold text-[#e8e5dc]">
                    هنوز فروشگاهی ثبت نشده است
                  </h3>
                  <p className="mt-2 max-w-sm text-xs leading-6 text-[#858378]">
                    اولین فروشگاه را اضافه کنید تا مدیریت آن را از این پنل آغاز
                    کنید.
                  </p>
                  <div className="mt-5">
                    <AddTenantDialog />
                  </div>
                </div>
              )}
            </section>

            <footer className="mt-8 flex flex-col gap-2 text-[11px] text-[#68675e] sm:flex-row sm:items-center sm:justify-between">
              <span>SK Team Platform · پنل مدیریت مادر</span>
              <span>سامانه مدیریت فروشگاه‌ها</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

function parsePhoneNumbers(value: unknown): string[] {
  const parsed: unknown = JSON.parse(typeof value === "string" ? value : "[]");
  if (!Array.isArray(parsed) || !parsed.every((phone) => typeof phone === "string")) {
    throw new Error("شماره‌های تماس ذخیره‌شده معتبر نیستند.");
  }
  return parsed;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
  }).format(new Date(`${value.replace(" ", "T")}Z`));
}

function DashboardIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-5 w-5"
    >
      <rect
        x="2.5"
        y="2.5"
        width="6"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="11.5"
        y="2.5"
        width="6"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="2.5"
        y="11.5"
        width="6"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="11.5"
        y="11.5"
        width="6"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M3 8v9h14V8M2 5l1-3h14l1 3a3 3 0 0 1-5 2 3 3 0 0 1-6 0 3 3 0 0 1-5-2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path
        d="M8 17v-5h4v5"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-5 w-5"
    >
      <ellipse cx="10" cy="4" rx="6.5" ry="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3.5 4v6c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V4m-13 6v6c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-6"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M10 2.5 16 5v4.6c0 3.7-2.6 6.5-6 7.9-3.4-1.4-6-4.2-6-7.9V5l6-2.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path
        d="m7.5 9.8 1.7 1.7 3.5-3.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M8 3H4.5A1.5 1.5 0 0 0 3 4.5v11A1.5 1.5 0 0 0 4.5 17H8m3-4 3-3-3-3m3 3H7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
