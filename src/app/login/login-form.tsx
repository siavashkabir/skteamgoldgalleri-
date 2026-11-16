"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildSessionCookie } from "@/lib/session-policy";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const remember = formData.get("remember") === "on";

    try {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage("ایمیل یا رمز عبور واردشده صحیح نیست.");
        setPending(false);
        return;
      }

      document.cookie = buildSessionCookie(
        remember,
        Date.now(),
        window.location.protocol === "https:",
      );
      router.replace(safeRedirectPath(searchParams.get("next")));
      router.refresh();
    } catch {
      setErrorMessage("ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.");
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2.5 block text-sm font-medium text-[#e5e0d4]">
          ایمیل
        </span>
        <span className="relative block">
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#77766e]">
            <MailIcon />
          </span>
          <input
            autoComplete="email"
            className="h-13 w-full rounded-xl border border-white/[0.09] bg-[#10100f] pr-12 pl-4 text-left text-sm text-[#f5f2e9] outline-none transition placeholder:text-[#64635c] focus:border-[#d6ad56]/70 focus:ring-4 focus:ring-[#d6ad56]/[0.08]"
            dir="ltr"
            name="email"
            placeholder="name@example.com"
            required
            type="email"
          />
        </span>
      </label>

      <label className="block">
        <span className="mb-2.5 block text-sm font-medium text-[#e5e0d4]">
          رمز عبور
        </span>
        <span className="relative block">
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#77766e]">
            <LockIcon />
          </span>
          <input
            autoComplete="current-password"
            className="h-13 w-full rounded-xl border border-white/[0.09] bg-[#10100f] pr-12 pl-14 text-left text-sm text-[#f5f2e9] outline-none transition placeholder:text-[#64635c] focus:border-[#d6ad56]/70 focus:ring-4 focus:ring-[#d6ad56]/[0.08]"
            dir="ltr"
            name="password"
            placeholder="••••••••"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
            className="absolute inset-y-0 left-3 flex items-center px-1 text-[#77766e] transition hover:text-[#d6ad56]"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            <EyeIcon crossed={!showPassword} />
          </button>
        </span>
      </label>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#c5c1b6]">
        <input
          className="h-4 w-4 accent-[#d6ad56]"
          name="remember"
          type="checkbox"
        />
        مرا به خاطر بسپار
      </label>

      {errorMessage ? (
        <p
          aria-live="polite"
          className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm leading-6 text-red-200"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <button
        className="group mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#d6ad56] px-5 text-sm font-semibold text-[#211a0d] shadow-[0_8px_24px_rgba(214,173,86,0.16)] transition hover:bg-[#e2bf70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e2bf70] disabled:cursor-wait disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? "در حال ورود..." : "ورود به پنل"}
        {!pending ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="h-4 w-4 transition group-hover:-translate-x-1"
          >
            <path
              d="M16 10H4m0 0 5-5m-5 5 5 5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            />
          </svg>
        ) : null}
      </button>
    </form>
  );
}

function safeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }
  const destination = new URL(value, window.location.origin);
  return destination.origin === window.location.origin
    ? `${destination.pathname}${destination.search}${destination.hash}`
    : "/";
}

function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m4 7 8 6 8-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <rect
        x="4"
        y="10"
        width="16"
        height="11"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 10V7a4 4 0 1 1 8 0v3m-4 5v2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M2.8 12s3.2-6 9.2-6 9.2 6 9.2 6-3.2 6-9.2 6-9.2-6-9.2-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      {crossed ? (
        <path
          d="m4 4 16 16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
      ) : null}
    </svg>
  );
}
