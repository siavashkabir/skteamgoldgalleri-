"use client";

import { useActionState, useState } from "react";
import { updateTenant, type TenantActionState } from "./actions";
import ThemeSettingsFields from "./theme-settings-fields";
import type { ThemeSettings } from "@/lib/theme-settings";

type Props = {
  tenant: {
    id: string;
    name: string;
    domain: string | null;
    ownerEmail: string;
    templateId: "luxury" | "minimal" | "classic";
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
    status: "active" | "trial" | "suspended";
    expiryDate: string;
  };
};

const initialState: TenantActionState = {};

export default function EditTenantDialog({ tenant }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateTenant,
    initialState,
  );
  const domain = tenant.domain?.replace(/^https?:\/\//i, "").replace(/\/$/, "");

  return (
    <>
      <button
        className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#d6ad56] transition hover:bg-white/[0.04]"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        ویرایش و تنظیم دامنه
      </button>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <section
            aria-labelledby={`edit-tenant-${tenant.id}`}
            aria-modal="true"
            className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#191918] p-6 shadow-2xl sm:p-8"
            role="dialog"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-medium text-[#d6ad56]">
                  مدیریت فروشگاه
                </p>
                <h2
                  className="text-xl font-semibold"
                  id={`edit-tenant-${tenant.id}`}
                >
                  ویرایش فروشگاه و تنظیم دامنه
                </h2>
              </div>
              <button
                aria-label="بستن پنجره"
                className="rounded-lg p-2 text-[#969387] hover:bg-white/[0.06]"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <form action={formAction} className="space-y-5">
              <input name="id" type="hidden" value={tenant.id} />
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  نام فروشگاه
                </span>
                <input
                  className="h-12 w-full rounded-xl border border-white/[0.09] bg-[#10100f] px-4 text-sm outline-none focus:border-[#d6ad56]/70"
                  defaultValue={tenant.name}
                  maxLength={120}
                  name="name"
                  required
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-[#c5c1b6] sm:col-span-2">
                  ایمیل مالک پنل فروشگاه
                  <input
                    className={inputClass}
                    defaultValue={tenant.ownerEmail}
                    dir="ltr"
                    name="owner_email"
                    required
                    type="email"
                  />
                </label>
                <label className="block text-sm text-[#c5c1b6]">
                  قالب فروشگاه
                  <select className={inputClass} defaultValue={tenant.templateId} name="template_id">
                    <option value="luxury">لوکس</option>
                    <option value="minimal">مینیمال</option>
                    <option value="classic">کلاسیک</option>
                  </select>
                </label>
                <label className="block text-sm text-[#c5c1b6]">
                  وضعیت اشتراک
                  <select
                    className={inputClass}
                    defaultValue={tenant.status}
                    name="status"
                  >
                    <option value="active">فعال</option>
                    <option value="trial">آزمایشی</option>
                    <option value="suspended">تعلیق‌شده</option>
                  </select>
                </label>
                <label className="block text-sm text-[#c5c1b6]">
                  تاریخ پایان اشتراک
                  <input
                    className={inputClass}
                    defaultValue={tenant.expiryDate}
                    name="expiry_date"
                    type="date"
                  />
                </label>
                <label className="block text-sm text-[#c5c1b6] sm:col-span-2">
                  توضیحات فروشگاه
                  <textarea className={`${inputClass} min-h-24 py-3`} defaultValue={tenant.description} maxLength={5000} name="description" rows={3} />
                </label>
                <label className="block text-sm text-[#c5c1b6]">
                  لوگو (URL)
                  <input className={inputClass} defaultValue={tenant.logoUrl} name="logo_url" type="url" />
                </label>
                <label className="block text-sm text-[#c5c1b6]">
                  نرخ بازار دلار (تومان)
                  <input className={inputClass} defaultValue={tenant.tomanRate} min="1" name="toman_rate" step="any" type="number" />
                </label>
                <label className="block text-sm text-[#c5c1b6]">
                  عنوان ویترین
                  <input className={inputClass} defaultValue={tenant.heroTitle} maxLength={200} name="hero_title" />
                </label>
                <label className="block text-sm text-[#c5c1b6]">
                  زیرعنوان ویترین
                  <input className={inputClass} defaultValue={tenant.heroSubtitle} maxLength={1000} name="hero_subtitle" />
                </label>
                <label className="block text-sm text-[#c5c1b6] sm:col-span-2">
                  شماره‌های تماس (هر شماره در یک خط)
                  <textarea className={`${inputClass} min-h-24 py-3`} defaultValue={tenant.phoneNumbers} maxLength={500} name="phone_numbers" rows={3} />
                </label>
                <label className="block text-sm text-[#c5c1b6] sm:col-span-2">
                  نشانی فروشگاه
                  <textarea className={`${inputClass} min-h-20 py-3`} defaultValue={tenant.addressText} maxLength={1000} name="address_text" rows={2} />
                </label>
                <label className="block text-sm text-[#c5c1b6] sm:col-span-2">
                  لینک موقعیت مکانی نقشه
                  <input className={inputClass} defaultValue={tenant.locationUrl} name="location_url" type="url" />
                </label>
                <label className="block text-sm text-[#c5c1b6]">
                  اینستاگرام
                  <input className={inputClass} defaultValue={tenant.instagramUrl} name="instagram_url" type="url" />
                </label>
                <label className="block text-sm text-[#c5c1b6]">
                  تلگرام
                  <input className={inputClass} defaultValue={tenant.telegramUrl} name="telegram_url" type="url" />
                </label>
                <label className="block text-sm text-[#c5c1b6] sm:col-span-2">
                  واتساپ
                  <input className={inputClass} defaultValue={tenant.whatsappUrl} name="whatsapp_url" type="url" />
                </label>
              </div>
              <ThemeSettingsFields defaultValue={tenant.themeSettings} />
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  دامنه اختصاصی
                </span>
                <input
                  className="h-12 w-full rounded-xl border border-white/[0.09] bg-[#10100f] px-4 text-left text-sm outline-none focus:border-[#d6ad56]/70"
                  defaultValue={domain}
                  dir="ltr"
                  maxLength={253}
                  name="domain"
                  placeholder="example.com"
                />
              </label>

              <section className="rounded-xl border border-[#d6ad56]/20 bg-[#d6ad56]/[0.04] p-4 sm:p-5">
                <h3 className="font-semibold text-[#e2c16d]">تنظیم دامنه</h3>
                <p className="mt-3 text-sm leading-6 text-[#c2bdaf]">
                  در داشبورد Cloudflare دامنه را به Worker متصل کنید و رکورد DNS زیر را بسازید:
                </p>
                <div className="mt-4 overflow-x-auto rounded-lg border border-white/[0.08]">
                  <table className="w-full min-w-[400px] text-left text-xs" dir="ltr">
                    <thead className="bg-white/[0.04] text-[#aaa79b]">
                      <tr>
                        <th className="p-3 font-medium">Type</th>
                        <th className="p-3 font-medium">Name / Host</th>
                        <th className="p-3 font-medium">Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3">CNAME</td>
                        <td className="p-3">{domain || "shop.example.com"}</td>
                        <td className="p-3">skteamgoldgalleri.sk-team-it.workers.dev</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <ol className="mt-3 list-decimal space-y-2 pr-5 text-sm leading-6 text-[#c2bdaf]">
                  <li>
                    در تنظیمات Custom Domains همان Worker، دامنه را اضافه و تأیید کنید.
                  </li>
                  <li>برای دامنه ریشه، در صورت نیاز از CNAME flattening کلادفلر استفاده کنید.</li>
                </ol>
                <p className="mt-3 text-xs leading-5 text-[#898578]">
                  پس از انتشار DNS، دامنه فروشگاه را در فیلد بالا ذخیره کنید.
                </p>
              </section>

              {state.error ? (
                <p className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200" role="alert">
                  {state.error}
                </p>
              ) : null}
              {state.success ? (
                <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200" role="status">
                  {state.success}
                </p>
              ) : null}

              <div className="flex gap-3">
                <button
                  className="h-11 flex-1 rounded-xl bg-[#d6ad56] px-4 text-sm font-semibold text-[#211a0d] disabled:opacity-60"
                  disabled={pending}
                  type="submit"
                >
                  {pending ? "در حال ذخیره..." : "ذخیره اطلاعات"}
                </button>
                <button
                  className="h-11 rounded-xl border border-white/10 px-4 text-sm text-[#c7c3b9] hover:bg-white/[0.05]"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  بستن
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-white/[0.09] bg-[#10100f] px-3 text-sm text-[#f5f2e9] outline-none focus:border-[#d6ad56]/60";
