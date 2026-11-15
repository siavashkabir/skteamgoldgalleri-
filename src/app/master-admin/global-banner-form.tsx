"use client";

import { useActionState } from "react";
import { saveGlobalBanner } from "./actions";

export default function GlobalBannerForm({
  bannerText,
}: {
  bannerText: string;
}) {
  const [state, action, pending] = useActionState(saveGlobalBanner, {});
  return (
    <form
      action={action}
      className="mb-8 grid gap-4 rounded-2xl border border-white/[0.07] bg-[#171716] p-5 sm:grid-cols-[1fr_auto] sm:items-end"
    >
      <label className="text-sm text-[#c5c1b6]">
        متن نمایشی در بالای ویترین‌ها
        <input
          className="mt-2 h-11 w-full rounded-xl border border-white/[0.09] bg-[#10100f] px-3 text-sm text-[#f5f2e9] outline-none focus:border-[#d6ad56]/60"
          defaultValue={bannerText}
          maxLength={500}
          name="banner_text"
          placeholder="اطلاعیه یا پیام ویژه"
        />
      </label>
      <button
        className="h-11 rounded-xl bg-[#d6ad56] px-4 text-sm font-semibold text-[#211a0d] disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "در حال ذخیره..." : "ذخیره بنر"}
      </button>
      {state.error || state.success ? (
        <p
          className={`text-sm sm:col-span-2 ${state.error ? "text-red-300" : "text-emerald-300"}`}
          role={state.error ? "alert" : "status"}
        >
          {state.error ?? state.success}
        </p>
      ) : null}
    </form>
  );
}
