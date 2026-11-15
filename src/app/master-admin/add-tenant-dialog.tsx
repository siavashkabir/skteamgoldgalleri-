"use client";

import { useActionState, useState } from "react";
import { createTenant, type TenantActionState } from "./actions";
import ThemeSettingsFields from "./theme-settings-fields";

const initialState: TenantActionState = {};

export default function AddTenantDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createTenant,
    initialState,
  );

  return (
    <>
      <button
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#d6ad56] px-4 text-sm font-semibold text-[#211a0d] shadow-[0_6px_20px_rgba(214,173,86,0.12)] transition hover:bg-[#e2bf70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e2bf70]"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <PlusIcon />
        افزودن فروشگاه جدید
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <section
            aria-labelledby="add-tenant-title"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#191918] p-6 shadow-2xl sm:p-8"
            role="dialog"
          >
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-medium text-[#d6ad56]">
                  مدیریت فروشگاه‌ها
                </p>
                <h2
                  className="text-xl font-semibold text-[#f5f2e9]"
                  id="add-tenant-title"
                >
                  افزودن فروشگاه جدید
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#969387]">
                  اطلاعات اولیه فروشگاه را وارد کنید.
                </p>
              </div>
              <button
                aria-label="بستن پنجره"
                className="rounded-lg p-2 text-[#969387] transition hover:bg-white/[0.06] hover:text-white"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <CloseIcon />
              </button>
            </div>

            <form action={formAction} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#e5e0d4]">
                  نام فروشگاه
                </span>
                <input
                  autoFocus
                  className="h-12 w-full rounded-xl border border-white/[0.09] bg-[#10100f] px-4 text-sm text-[#f5f2e9] outline-none transition placeholder:text-[#64635c] focus:border-[#d6ad56]/70 focus:ring-4 focus:ring-[#d6ad56]/[0.08]"
                  maxLength={120}
                  name="name"
                  placeholder="گالری طلای امیر"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#e5e0d4]">
                  دامنه{" "}
                  <span className="font-normal text-[#77766e]">(اختیاری)</span>
                </span>
                <input
                  className="h-12 w-full rounded-xl border border-white/[0.09] bg-[#10100f] px-4 text-left text-sm text-[#f5f2e9] outline-none transition placeholder:text-[#64635c] focus:border-[#d6ad56]/70 focus:ring-4 focus:ring-[#d6ad56]/[0.08]"
                  dir="ltr"
                  maxLength={253}
                  name="domain"
                  placeholder="shop.example.com"
                  type="text"
                />
              </label>
              <ThemeSettingsFields />

              {state.error ? (
                <p
                  aria-live="polite"
                  className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200"
                  role="alert"
                >
                  {state.error}
                </p>
              ) : null}
              {state.success ? (
                <p
                  aria-live="polite"
                  className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200"
                  role="status"
                >
                  {state.success}
                </p>
              ) : null}

              <div className="flex items-center gap-3 pt-1">
                <button
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#d6ad56] px-4 text-sm font-semibold text-[#211a0d] transition hover:bg-[#e2bf70] disabled:cursor-wait disabled:opacity-70"
                  disabled={pending}
                  type="submit"
                >
                  {pending ? "در حال ثبت..." : "ثبت فروشگاه"}
                </button>
                <button
                  className="h-11 rounded-xl border border-white/10 px-4 text-sm font-medium text-[#c7c3b9] transition hover:bg-white/[0.05]"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  انصراف
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M10 4v12M4 10h12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="m5 5 10 10M15 5 5 15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
