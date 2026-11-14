"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage("اگر این ایمیل در سامانه ثبت شده باشد، لینک بازنشانی برایتان ارسال می‌شود.");
    } catch {
      setError("ارسال لینک بازنشانی انجام نشد. لطفاً دوباره تلاش کنید.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <label className="block text-sm text-[#c5c1b6]">
        ایمیل حساب کاربری
        <input autoComplete="email" className={inputClass} dir="ltr" name="email" required type="email" />
      </label>
      {message || error ? (
        <p className={`rounded-xl px-4 py-3 text-sm ${error ? "bg-red-400/[0.07] text-red-200" : "bg-emerald-400/[0.07] text-emerald-200"}`} role={error ? "alert" : "status"}>
          {error || message}
        </p>
      ) : null}
      <button className={buttonClass} disabled={pending} type="submit">
        {pending ? "در حال ارسال..." : "ارسال لینک بازنشانی"}
      </button>
      <Link className="block text-center text-sm text-[#e2c16d]" href="/login">بازگشت به ورود</Link>
    </form>
  );
}

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-white/[0.09] bg-[#10100f] px-4 text-sm text-[#f5f2e9] outline-none focus:border-[#d6ad56]/60";
const buttonClass =
  "w-full rounded-xl bg-[#d6ad56] px-4 py-3 text-sm font-semibold text-[#211a0d] disabled:opacity-60";
