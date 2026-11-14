"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { DEFAULT_STORE_SLUG } from "@/lib/storefront-types";
import { createMockOrder } from "./actions";
import { useCart } from "../storefront-provider";

const initialState: { error?: string; orderNumber?: string } = {};

export default function CheckoutPage() {
  const { items, totalPrice, totalWeight, clearCart } = useCart();
  const [state, action, pending] = useActionState(createMockOrder, initialState);
  const tenantIds = new Set(items.map((item) => item.tenantId));
  const canCheckout = items.length > 0 && tenantIds.size === 1;

  useEffect(() => {
    if (state.orderNumber) {
      clearCart();
    }
  }, [clearCart, state.orderNumber]);

  if (state.orderNumber) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] text-3xl text-emerald-300">
          ✓
        </span>
        <p className="mt-6 text-xs font-medium text-[#d6ad56]">
          سفارش شما ثبت شد
        </p>
        <h1 className="mt-2 text-2xl font-semibold">از خرید شما سپاسگزاریم</h1>
        <p className="mt-3 text-sm leading-7 text-[#929085]">
          سفارش شما با موفقیت ثبت شد. برای هماهنگی و پرداخت، فروشگاه با شما
          تماس خواهد گرفت.
        </p>
        <p className="mt-5 inline-flex rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-[#c5c1b6]">
          کد سفارش: <span className="mr-2 font-mono text-[#e2c16d]">{state.orderNumber}</span>
        </p>
        <Link
          className="mx-auto mt-8 block w-fit rounded-xl bg-[#d6ad56] px-5 py-3 text-sm font-semibold text-[#211a0d] hover:bg-[#e2bf70]"
          href={`/${DEFAULT_STORE_SLUG}`}
        >
          بازگشت به فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <p className="text-xs font-medium text-[#d6ad56]">مرحله پایانی</p>
      <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">اطلاعات ارسال</h1>
      <p className="mt-2 text-sm text-[#858378]">
        فعلاً پرداخت آنلاین فعال نیست؛ پس از ثبت سفارش با شما هماهنگ می‌کنیم.
      </p>

      {!canCheckout ? (
        <div className="mt-8 rounded-2xl border border-white/[0.07] bg-[#171716] px-5 py-12 text-center">
          <p className="text-sm text-[#aaa79b]">
            {items.length === 0
              ? "سبد خرید شما خالی است."
              : "ثبت هم‌زمان کالاهای چند فروشگاه امکان‌پذیر نیست؛ سبد را بررسی کنید."}
          </p>
          <Link
            className="mt-5 inline-flex text-sm text-[#e2c16d] hover:text-[#f0d48f]"
            href="/cart"
          >
            بازگشت به سبد خرید
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
          <form
            action={action}
            className="rounded-2xl border border-white/[0.07] bg-[#171716] p-5 sm:p-7"
          >
            <input
              name="items"
              type="hidden"
              value={JSON.stringify(
                items.map(({ productId, quantity, tenantId }) => ({
                  productId,
                  quantity,
                  tenantId,
                })),
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-[#c5c1b6] sm:col-span-2">
                نام و نام خانوادگی
                <input
                  autoComplete="name"
                  className={inputClass}
                  maxLength={120}
                  name="customer_name"
                  required
                />
              </label>
              <label className="text-sm text-[#c5c1b6]">
                شماره تماس
                <input
                  autoComplete="tel"
                  className={inputClass}
                  dir="ltr"
                  maxLength={25}
                  name="customer_phone"
                  required
                  type="tel"
                />
              </label>
              <label className="text-sm text-[#c5c1b6]">
                شهر
                <input
                  autoComplete="address-level2"
                  className={inputClass}
                  maxLength={100}
                  name="shipping_city"
                  required
                />
              </label>
              <label className="text-sm text-[#c5c1b6] sm:col-span-2">
                نشانی کامل
                <textarea
                  autoComplete="street-address"
                  className={`${inputClass} min-h-28 resize-y py-3 leading-7`}
                  maxLength={1000}
                  name="shipping_address"
                  required
                  rows={4}
                />
              </label>
              <label className="text-sm text-[#c5c1b6]">
                کد پستی (اختیاری)
                <input
                  autoComplete="postal-code"
                  className={inputClass}
                  dir="ltr"
                  maxLength={15}
                  name="shipping_postal_code"
                />
              </label>
            </div>
            {state.error ? (
              <p
                aria-live="polite"
                className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200"
                role="alert"
              >
                {state.error}
              </p>
            ) : null}
            <button
              className="mt-6 w-full rounded-xl bg-[#d6ad56] px-5 py-3.5 text-sm font-semibold text-[#211a0d] transition hover:bg-[#e2bf70] disabled:cursor-wait disabled:opacity-60"
              disabled={pending}
              type="submit"
            >
              {pending ? "در حال ثبت سفارش..." : "ثبت سفارش"}
            </button>
          </form>

          <aside className="h-fit rounded-2xl border border-[#d6ad56]/15 bg-[#171716] p-5 sm:p-6">
            <h2 className="text-base font-semibold">خلاصه سفارش</h2>
            <div className="mt-4 space-y-3 border-b border-white/[0.07] pb-4">
              {items.map((item) => (
                <div
                  className="flex justify-between gap-3 text-xs"
                  key={`${item.tenantId}-${item.productId}`}
                >
                  <span className="line-clamp-1 text-[#aaa79b]">
                    {item.name} × {item.quantity.toLocaleString("fa-IR")}
                  </span>
                  <span className="shrink-0 text-[#c5c1b6]">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between gap-3 text-sm">
              <span className="text-[#aaa79b]">جمع کل</span>
              <span className="font-semibold text-[#e2c16d]">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <div className="mt-3 flex justify-between gap-3 text-sm">
              <span className="text-[#aaa79b]">وزن کل</span>
              <span className="text-[#c5c1b6]">
                {totalWeight.toLocaleString("fa-IR")} گرم
              </span>
            </div>
            <p className="mt-4 text-[11px] leading-5 text-[#77766e]">
              هزینه ارسال و پرداخت نهایی پس از تماس فروشگاه اعلام می‌شود.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-white/[0.09] bg-[#10100f] px-3 text-sm text-[#f5f2e9] outline-none focus:border-[#d6ad56]/60";

function formatPrice(value: number): string {
  return `${value.toLocaleString("fa-IR")} تومان`;
}
