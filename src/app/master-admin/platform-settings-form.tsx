"use client";

import { useActionState } from "react";
import { savePlatformSettings } from "./actions";

export default function PlatformSettingsForm({
  name,
  url,
}: {
  name: string;
  url: string;
}) {
  const [state, action, pending] = useActionState(savePlatformSettings, {});
  return (
    <form
      action={action}
      className="mb-8 grid gap-4 rounded-2xl border border-white/[0.07] bg-[#171716] p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
    >
      <label className="text-sm text-[#c5c1b6]">
        نام پلتفرم
        <input className={inputClass} defaultValue={name} maxLength={100} name="platform_name" required />
      </label>
      <label className="text-sm text-[#c5c1b6]">
        نشانی پلتفرم
        <input className={inputClass} defaultValue={url} name="platform_url" placeholder="https://skteam.ir" type="url" />
      </label>
      <button className={buttonClass} disabled={pending} type="submit">
        {pending ? "در حال ذخیره..." : "ذخیره برند"}
      </button>
      {state.error || state.success ? (
        <p className={`text-sm sm:col-span-3 ${state.error ? "text-red-300" : "text-emerald-300"}`} role={state.error ? "alert" : "status"}>
          {state.error ?? state.success}
        </p>
      ) : null}
    </form>
  );
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-white/[0.09] bg-[#10100f] px-3 text-sm text-[#f5f2e9] outline-none focus:border-[#d6ad56]/60";
const buttonClass =
  "h-11 rounded-xl bg-[#d6ad56] px-4 text-sm font-semibold text-[#211a0d] disabled:opacity-60";

