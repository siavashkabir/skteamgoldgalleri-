"use client";

import { useActionState } from "react";
import { saveStoreSettings } from "./actions";

export type StoreSettings = {
  name: string;
  domain: string;
  description: string;
  instagramUrl: string;
  telegramUrl: string;
  whatsappUrl: string;
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  phoneNumbers: string;
  addressText: string;
  locationUrl: string;
  tomanRate: string;
};

export default function StoreSettingsForm({
  settings,
}: {
  settings: StoreSettings;
}) {
  const [state, action, pending] = useActionState(saveStoreSettings, {});

  return (
    <form
      action={action}
      className="mt-7 max-w-3xl rounded-2xl border border-white/[0.08] bg-[#171716] p-5 sm:p-7"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm text-[#c5c1b6]">
          نام فروشگاه
          <input
            className={inputClass}
            defaultValue={settings.name}
            maxLength={120}
            name="name"
            required
          />
        </label>
        <label className="block text-sm text-[#c5c1b6]">
          دامنه فروشگاه (اختیاری)
          <input
            className={inputClass}
            defaultValue={settings.domain}
            maxLength={253}
            name="domain"
            placeholder="shop.example.com"
          />
        </label>
        <label className="block text-sm text-[#c5c1b6] sm:col-span-2">
          توضیحات فروشگاه
          <textarea
            className={`${inputClass} min-h-32 resize-y py-3 leading-7`}
            defaultValue={settings.description}
            maxLength={5000}
            name="description"
            placeholder="درباره فروشگاه و محصولات آن بنویسید."
            rows={5}
          />
        </label>
        <label className="block text-sm text-[#c5c1b6]">
          نشانی لوگو
          <input className={inputClass} defaultValue={settings.logoUrl} name="logo_url" type="url" />
        </label>
        <label className="block text-sm text-[#c5c1b6]">
          نرخ بازار دلار (تومان)
          <input className={inputClass} defaultValue={settings.tomanRate} min="1" name="toman_rate" step="any" type="number" />
          <span className="mt-1 block text-xs leading-5 text-[#858378]">
            این نرخ برای تبدیل قیمت جهانی طلا به تومان استفاده می‌شود؛ بدون آن قیمت ۱۸ عیار نمایش داده نمی‌شود.
          </span>
        </label>
        <label className="block text-sm text-[#c5c1b6]">
          عنوان ویترین
          <input className={inputClass} defaultValue={settings.heroTitle} maxLength={200} name="hero_title" />
        </label>
        <label className="block text-sm text-[#c5c1b6]">
          زیرعنوان ویترین
          <input className={inputClass} defaultValue={settings.heroSubtitle} maxLength={1000} name="hero_subtitle" />
        </label>
        <label className="block text-sm text-[#c5c1b6] sm:col-span-2">
          شماره‌های تماس (هر شماره در یک خط)
          <textarea className={`${inputClass} min-h-24 py-3`} defaultValue={settings.phoneNumbers} maxLength={500} name="phone_numbers" rows={3} />
        </label>
        <label className="block text-sm text-[#c5c1b6] sm:col-span-2">
          نشانی فروشگاه
          <textarea className={`${inputClass} min-h-20 py-3`} defaultValue={settings.addressText} maxLength={1000} name="address_text" rows={2} />
        </label>
        <label className="block text-sm text-[#c5c1b6] sm:col-span-2">
          لینک موقعیت نقشه
          <input className={inputClass} defaultValue={settings.locationUrl} name="location_url" type="url" />
        </label>
        <label className="block text-sm text-[#c5c1b6]">
          لینک اینستاگرام
          <input
            className={inputClass}
            defaultValue={settings.instagramUrl}
            name="instagram_url"
            placeholder="https://instagram.com/..."
            type="url"
          />
        </label>
        <label className="block text-sm text-[#c5c1b6]">
          لینک تلگرام
          <input
            className={inputClass}
            defaultValue={settings.telegramUrl}
            name="telegram_url"
            placeholder="https://t.me/..."
            type="url"
          />
        </label>
        <label className="block text-sm text-[#c5c1b6] sm:col-span-2">
          لینک واتساپ
          <input
            className={inputClass}
            defaultValue={settings.whatsappUrl}
            name="whatsapp_url"
            placeholder="https://wa.me/..."
            type="url"
          />
        </label>
      </div>

      <button className={`${buttonClass} mt-6`} disabled={pending} type="submit">
        {pending ? "در حال ذخیره..." : "ذخیره تنظیمات"}
      </button>
      {state.error || state.success ? (
        <p
          aria-live="polite"
          className={`mt-4 text-sm ${state.error ? "text-red-300" : "text-emerald-300"}`}
          role={state.error ? "alert" : "status"}
        >
          {state.error ?? state.success}
        </p>
      ) : null}
    </form>
  );
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-white/[0.09] bg-[#10100f] px-3 text-sm text-[#f5f2e9] outline-none focus:border-[#d6ad56]/60";
const buttonClass =
  "rounded-xl bg-[#d6ad56] px-4 py-2.5 text-sm font-semibold text-[#211a0d] transition hover:bg-[#e2bf70] disabled:opacity-60";
