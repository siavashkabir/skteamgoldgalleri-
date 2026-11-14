"use client";

import { useActionState } from "react";
import { submitCustomOrder } from "./actions";
import type { AdminActionState } from "../admin/action-state";

const initialState: AdminActionState = {};

export default function CustomOrderForm() {
  const [state, formAction, pending] = useActionState(
    submitCustomOrder,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium">تصویر طرح</span>
        <input
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="block w-full rounded-xl border border-white/10 bg-[#10100f] p-3 text-sm text-[#d8d3c7] file:ml-3 file:rounded-lg file:border-0 file:bg-[#d6ad56] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#211a0d]"
          name="image"
          required
          type="file"
        />
        <span className="mt-1 block text-xs text-[#77766e]">
          JPEG، PNG، WebP یا AVIF؛ حداکثر ۵ مگابایت
        </span>
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium">توضیحات طرح</span>
        <textarea
          className="min-h-28 w-full rounded-xl border border-white/10 bg-[#10100f] px-4 py-3 text-sm outline-none focus:border-[#d6ad56]/70"
          maxLength={5000}
          name="description"
          placeholder="ویژگی‌ها، ابعاد یا جزئیات موردنظر را توضیح دهید."
          required
          rows={4}
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium">اطلاعات تماس</span>
        <input
          className="h-12 w-full rounded-xl border border-white/10 bg-[#10100f] px-4 text-sm outline-none focus:border-[#d6ad56]/70"
          maxLength={500}
          name="contact_info"
          placeholder="شماره تلفن یا راه ارتباطی"
          required
        />
      </label>
      {state.error ? (
        <p className="rounded-xl border border-red-400/20 bg-red-400/[0.07] p-3 text-sm text-red-200" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-3 text-sm text-emerald-200" role="status">
          {state.success}
        </p>
      ) : null}
      <button
        className="h-11 rounded-xl bg-[#d6ad56] px-5 text-sm font-semibold text-[#211a0d] disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "در حال ثبت..." : "ثبت سفارش اختصاصی"}
      </button>
    </form>
  );
}
