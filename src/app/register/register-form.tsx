"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerCustomer } from "./actions";

export default function RegisterForm() {
  const [state, action, pending] = useActionState(registerCustomer, {});
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-[#c5c1b6]">
          نام
          <input autoComplete="given-name" className={inputClass} maxLength={80} name="first_name" required />
        </label>
        <label className="text-sm text-[#c5c1b6]">
          نام خانوادگی
          <input autoComplete="family-name" className={inputClass} maxLength={80} name="last_name" required />
        </label>
        <label className="text-sm text-[#c5c1b6]">
          کد ملی
          <input
            className={inputClass}
            dir="ltr"
            inputMode="numeric"
            maxLength={10}
            minLength={10}
            name="national_id"
            pattern="[0-9]{10}"
            required
          />
        </label>
        <label className="text-sm text-[#c5c1b6]">
          موبایل
          <input autoComplete="tel" className={inputClass} dir="ltr" maxLength={25} name="mobile" required type="tel" />
        </label>
        <label className="text-sm text-[#c5c1b6] sm:col-span-2">
          ایمیل
          <input autoComplete="email" className={inputClass} dir="ltr" maxLength={254} name="email" required type="email" />
        </label>
        <label className="text-sm text-[#c5c1b6] sm:col-span-2">
          رمز عبور (حداقل ۸ نویسه)
          <input autoComplete="new-password" className={inputClass} minLength={8} name="password" required type="password" />
        </label>
        <label className="text-sm text-[#c5c1b6] sm:col-span-2">
          نشانی
          <textarea autoComplete="street-address" className={`${inputClass} min-h-24 py-3`} maxLength={1000} name="address" required rows={3} />
        </label>
      </div>
      <p className="rounded-xl border border-amber-300/20 bg-amber-300/[0.05] px-4 py-3 text-sm leading-7 text-amber-100" role="note">
        نام و نام خانوادگی و کد ملی باید دقیقاً مطابق با شناسنامه باشد.
      </p>
      {state.error || state.success ? (
        <p className={`rounded-xl px-4 py-3 text-sm ${state.error ? "bg-red-400/[0.07] text-red-200" : "bg-emerald-400/[0.07] text-emerald-200"}`} role={state.error ? "alert" : "status"}>
          {state.error ?? state.success}
        </p>
      ) : null}
      {state.success ? (
        <Link className="block text-center text-sm text-[#e2c16d]" href="/login">رفتن به صفحه ورود</Link>
      ) : (
        <button className={buttonClass} disabled={pending} type="submit">
          {pending ? "در حال ساخت حساب..." : "ثبت‌نام"}
        </button>
      )}
      <p className="text-center text-sm text-[#858378]">
        قبلاً ثبت‌نام کرده‌اید؟ <Link className="text-[#e2c16d]" href="/login">ورود</Link>
      </p>
    </form>
  );
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-white/[0.09] bg-[#10100f] px-3 text-sm text-[#f5f2e9] outline-none focus:border-[#d6ad56]/60";
const buttonClass =
  "w-full rounded-xl bg-[#d6ad56] px-4 py-3 text-sm font-semibold text-[#211a0d] disabled:opacity-60";
