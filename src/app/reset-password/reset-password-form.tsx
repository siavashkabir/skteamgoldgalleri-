"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");
    if (password.length < 8 || password !== confirmation) {
      setError(password.length < 8 ? "رمز عبور باید حداقل ۸ نویسه باشد." : "تکرار رمز عبور یکسان نیست.");
      setPending(false);
      return;
    }
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("رمز عبور شما با موفقیت تغییر کرد.");
    } catch {
      setError("نشست بازنشانی معتبر نیست یا منقضی شده است. دوباره درخواست لینک کنید.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <label className="block text-sm text-[#c5c1b6]">
        رمز عبور جدید
        <input autoComplete="new-password" className={inputClass} minLength={8} name="password" required type="password" />
      </label>
      <label className="block text-sm text-[#c5c1b6]">
        تکرار رمز عبور
        <input autoComplete="new-password" className={inputClass} minLength={8} name="confirmation" required type="password" />
      </label>
      {message || error ? (
        <p className={`rounded-xl px-4 py-3 text-sm ${error ? "bg-red-400/[0.07] text-red-200" : "bg-emerald-400/[0.07] text-emerald-200"}`} role={error ? "alert" : "status"}>
          {error || message}
        </p>
      ) : null}
      {message ? <Link className="block text-center text-sm text-[#e2c16d]" href="/login">ورود با رمز جدید</Link> : (
        <button className={buttonClass} disabled={pending} type="submit">{pending ? "در حال ذخیره..." : "تغییر رمز عبور"}</button>
      )}
    </form>
  );
}

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-white/[0.09] bg-[#10100f] px-4 text-sm text-[#f5f2e9] outline-none focus:border-[#d6ad56]/60";
const buttonClass =
  "w-full rounded-xl bg-[#d6ad56] px-4 py-3 text-sm font-semibold text-[#211a0d] disabled:opacity-60";
