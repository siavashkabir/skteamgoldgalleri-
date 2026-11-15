import { Suspense } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { getTenantAdminContext } from "@/lib/admin-context";
import { readImpersonatedTenantId } from "@/lib/admin-impersonation";
import { signOut } from "@/app/master-admin/actions";
import { stopImpersonatingTenant } from "@/app/master-admin/actions";
import OnboardingForm from "./onboarding-form";
import type { TenantModule } from "@/lib/tenant-modules";

export const dynamic = "force-dynamic";

const navigation = [
  { href: "/admin", label: "داشبورد", icon: "⌂" },
  { href: "/admin/categories", label: "مدیریت دسته‌بندی‌ها", icon: "◇", module: "ecommerce" },
  { href: "/admin/products", label: "مدیریت محصولات", icon: "◈", module: "ecommerce" },
  { href: "/admin/orders", label: "سفارش‌ها", icon: "▤", module: "ecommerce" },
  { href: "/admin/bookings", label: "درخواست‌های رزرو", icon: "◷", module: "booking" },
  { href: "/admin/customers", label: "مشتریان", icon: "♙", module: "ecommerce" },
  { href: "/admin/custom-orders", label: "سفارش اختصاصی", icon: "✧", module: "gallery" },
  { href: "/admin/settings", label: "تنظیمات فروشگاه", icon: "⚙" },
  { href: "/admin/guide", label: "راهنمای فروشگاه", icon: "ⓘ" },
] satisfies Array<{ href: string; label: string; icon: string; module?: TenantModule }>;

export default function TenantAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#10100f]" aria-busy="true" />
      }
    >
      <TenantAdminShell>{children}</TenantAdminShell>
    </Suspense>
  );
}

async function TenantAdminShell({ children }: { children: React.ReactNode }) {
  const context = await getTenantAdminContext({ allowIncompleteProfile: true });
  const { email, tenantName, enabledModules } = context;
  if (
    context.role === "tenant_admin" &&
    (!context.kycData.full_name ||
      !context.kycData.national_id ||
      !context.kycData.address ||
      !context.kycData.phone ||
      !context.legalAgreedAt)
  ) {
    return (
      <OnboardingForm
        businessType={context.businessType}
        tenantName={tenantName}
        values={context.kycData}
      />
    );
  }
  const isImpersonating = (await readImpersonatedTenantId()) !== null;

  return (
    <div className="min-h-screen bg-[#10100f] text-[#f5f2e9] lg:flex">
      <aside className="border-b border-white/[0.07] bg-[#151514] p-4 lg:flex lg:min-h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-l lg:p-6">
        <Link className="mb-6 flex items-center gap-3 lg:mb-10" href="/admin">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e2c16d]/30 bg-[#d6ad56]/10 text-xl font-semibold text-[#e2c16d]">
            ت
          </span>
          <span>
            <span className="block text-sm font-semibold">{tenantName}</span>
            <span className="mt-1 block max-w-40 truncate text-xs text-[#8b897f]">
              {tenantName}
            </span>
          </span>
        </Link>

        <nav aria-label="منوی مدیریت فروشگاه" className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
          {navigation.filter((item) =>
            !item.module ||
            context.role === "super_admin" ||
            enabledModules.includes(item.module) ||
            (item.href === "/admin/bookings" && enabledModules.includes("tourism")) ||
            (item.href === "/admin/customers" &&
              (enabledModules.includes("booking") || enabledModules.includes("tourism"))),
          ).map((item) => (
            <Link
              className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#aaa79b] transition hover:bg-white/[0.05] hover:text-[#f5f2e9] lg:py-3"
              href={item.href}
              key={item.href}
            >
              <span aria-hidden="true" className="w-5 text-center text-[#d6ad56]">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 hidden border-t border-white/[0.07] pt-5 lg:mt-auto lg:block">
          <p className="truncate px-3 text-xs text-[#8b897f]" dir="ltr">
            {email}
          </p>
          <form action={signOut} className="mt-3">
            <button className="w-full rounded-xl px-3 py-2.5 text-right text-sm text-[#aaa79b] transition hover:bg-white/[0.05] hover:text-white">
              خروج از حساب
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-8 lg:px-10">
          <div>
            <p className="text-sm font-semibold">پنل مدیریت فروشگاه</p>
            <p className="mt-1 text-xs text-[#8b897f]">{tenantName}</p>
          </div>
          <form action={signOut} className="lg:hidden">
            <button className="rounded-lg px-3 py-2 text-sm text-[#aaa79b] hover:bg-white/[0.05]">
              خروج
            </button>
          </form>
        </header>
        {isImpersonating ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300/15 bg-amber-300/[0.07] px-5 py-3 text-xs text-amber-100 sm:px-8 lg:px-10">
            <span>شما به‌عنوان مدیر کل در پنل این فروشگاه هستید.</span>
            <form action={stopImpersonatingTenant}>
              <button
                className="rounded-lg border border-amber-200/20 px-3 py-2 hover:bg-amber-200/10"
                type="submit"
              >
                بازگشت به پنل مدیریت مادر
              </button>
            </form>
          </div>
        ) : null}
        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
