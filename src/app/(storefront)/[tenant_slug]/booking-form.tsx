"use client";

import { useActionState } from "react";
import { createBooking } from "./booking-actions";

export default function BookingForm({
  tenantSlug,
}: {
  tenantSlug: string;
}) {
  const [state, action, pending] = useActionState(createBooking, {});
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input name="tenant_slug" type="hidden" value={tenantSlug} />
      <label className="text-sm">
        نام و نام خانوادگی
        <input className={inputClass} maxLength={120} name="name" required />
      </label>
      <label className="text-sm">
        شماره تماس
        <input className={inputClass} maxLength={40} name="phone" required type="tel" />
      </label>
      <label className="text-sm">
        خدمت یا مقصد موردنظر
        <input className={inputClass} maxLength={160} name="service_id" />
      </label>
      <label className="text-sm">
        تاریخ پیشنهادی
        <input className={inputClass} min={new Date().toISOString().slice(0, 10)} name="booking_date" required type="date" />
      </label>
      {state.error || state.success ? (
        <p aria-live="polite" className={`sm:col-span-2 text-sm ${state.error ? "text-red-500" : "text-emerald-500"}`} role={state.error ? "alert" : "status"}>
          {state.error ?? state.success}
        </p>
      ) : null}
      <button className="w-fit rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-bg)] disabled:opacity-60 sm:col-span-2" disabled={pending} type="submit">
        {pending ? "در حال ثبت..." : "ثبت درخواست"}
      </button>
    </form>
  );
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-current/15 bg-[var(--color-card)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]";
