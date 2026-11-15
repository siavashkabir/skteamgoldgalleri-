"use client";

import { useActionState } from "react";
import { completeTenantOnboarding } from "./onboarding-actions";
import type { AdminActionState } from "./action-state";

export default function OnboardingForm({
  tenantName,
  businessType,
  values,
}: {
  tenantName: string;
  businessType: string;
  values: Record<string, string>;
}) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(
    completeTenantOnboarding,
    {},
  );
  return (
    <main className="min-h-screen bg-[#10100f] px-5 py-10 text-[#f5f2e9] sm:px-8">
      <form
        action={action}
        className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-white/[0.08] bg-[#171716] p-6 sm:p-9"
      >
        <p className="text-sm font-medium text-[#d6ad56]">تکمیل اطلاعات مالک</p>
        <h1 className="text-2xl font-semibold">به پنل {tenantName} خوش آمدید</h1>
        <p className="text-sm leading-7 text-[#aaa79b]">
          برای دسترسی به امکانات مدیریت، اطلاعات کسب‌وکار و توافق‌نامه را تکمیل کنید.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-[#c5c1b6]">
            نام و نام خانوادگی
            <input className={inputClass} defaultValue={values.full_name} maxLength={120} name="full_name" required />
          </label>
          <label className="text-sm text-[#c5c1b6]">
            کد ملی / شناسه ملی
            <input className={inputClass} defaultValue={values.national_id} maxLength={30} name="national_id" required />
          </label>
          <label className="text-sm text-[#c5c1b6]">
            شماره تماس
            <input className={inputClass} defaultValue={values.phone} maxLength={40} name="phone" required type="tel" />
          </label>
          <label className="text-sm text-[#c5c1b6]">
            نوع کسب‌وکار
            <input className={inputClass} defaultValue={businessType} maxLength={120} name="business_type" />
          </label>
          <label className="text-sm text-[#c5c1b6] sm:col-span-2">
            نشانی کامل
            <textarea className={`${inputClass} min-h-24 py-3`} defaultValue={values.address} maxLength={1000} name="address" required rows={3} />
          </label>
          <label className="text-sm text-[#c5c1b6] sm:col-span-2">
            مجوز کسب‌وکار (اختیاری، PDF یا تصویر تا ۵ مگابایت)
            <input accept="application/pdf,image/jpeg,image/png,image/webp" className={`${inputClass} h-auto py-2`} name="license" type="file" />
          </label>
        </div>
        <label className="flex items-start gap-3 rounded-xl border border-white/[0.08] p-4 text-sm leading-7 text-[#c5c1b6]">
          <input className="mt-2" name="legal_agreed" required type="checkbox" />
          <span>
            مسئولیت صحت اطلاعات و محتوای منتشرشده، رعایت قوانین جاری، حفظ حقوق مشتریان و پاسخ‌گویی به سفارش‌ها بر عهده کسب‌وکار من است. با شرایط استفاده از سامانه و این مسئولیت‌ها موافقم.
          </span>
        </label>
        {state.error || state.success ? (
          <p aria-live="polite" className={state.error ? "text-sm text-red-300" : "text-sm text-emerald-300"} role={state.error ? "alert" : "status"}>
            {state.error ?? state.success}
          </p>
        ) : null}
        <button className="rounded-xl bg-[#d6ad56] px-5 py-3 text-sm font-semibold text-[#211a0d] disabled:opacity-60" disabled={pending} type="submit">
          {pending ? "در حال ثبت..." : "تأیید و ورود به پنل"}
        </button>
      </form>
    </main>
  );
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-white/[0.09] bg-[#10100f] px-3 text-sm text-[#f5f2e9] outline-none focus:border-[#d6ad56]/60";
