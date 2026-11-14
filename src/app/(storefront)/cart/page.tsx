"use client";

import Image from "next/image";
import Link from "next/link";
import { DEFAULT_STORE_SLUG } from "@/lib/storefront-types";
import { useCart } from "../storefront-provider";

export default function CartPage() {
  const {
    items,
    itemCount,
    totalPrice,
    totalWeight,
    removeItem,
    setQuantity,
  } = useCart();

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <p className="text-xs font-medium text-[#d6ad56]">سبد خرید شما</p>
      <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">مرور سفارش</h1>
      <p className="mt-2 text-sm text-[#858378]">
        {itemCount.toLocaleString("fa-IR")} عدد محصول در سبد خرید
      </p>

      {items.length ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="divide-y divide-white/[0.07] rounded-2xl border border-white/[0.07] bg-[#171716] px-4 sm:px-6">
            {items.map((item) => (
              <article
                className="flex gap-4 py-5 sm:gap-5"
                key={`${item.tenantId}-${item.productId}`}
              >
                <Link
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#211d14] sm:h-28 sm:w-28"
                  href={`/${item.tenantSlug}/products/${item.productId}`}
                >
                  {item.imageUrl ? (
                    <Image
                      alt={item.name}
                      className="object-cover"
                      fill
                      sizes="112px"
                      src={item.imageUrl}
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-4xl text-[#d6ad56]/70">
                      ◈
                    </span>
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <Link
                      className="line-clamp-1 text-sm font-semibold hover:text-[#e2c16d]"
                      href={`/${item.tenantSlug}/products/${item.productId}`}
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1.5 text-xs text-[#858378]">
                      {item.weight === null
                        ? "وزن ثبت نشده"
                        : `${item.weight.toLocaleString("fa-IR")} گرم`}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#e2c16d]">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <div className="flex items-center rounded-lg border border-white/[0.09]">
                      <button
                        aria-label="کاهش تعداد"
                        className="px-3 py-1.5 text-[#c5c1b6] hover:text-[#e2c16d]"
                        onClick={() =>
                          item.quantity === 1
                            ? removeItem(item.productId)
                            : setQuantity(item.productId, item.quantity - 1)
                        }
                        type="button"
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center text-xs tabular-nums">
                        {item.quantity.toLocaleString("fa-IR")}
                      </span>
                      <button
                        aria-label="افزایش تعداد"
                        className="px-3 py-1.5 text-[#c5c1b6] hover:text-[#e2c16d]"
                        disabled={item.quantity >= 20}
                        onClick={() =>
                          setQuantity(item.productId, item.quantity + 1)
                        }
                        type="button"
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="text-xs text-[#898578] transition hover:text-red-300"
                      onClick={() => removeItem(item.productId)}
                      type="button"
                    >
                      حذف محصول
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside className="h-fit rounded-2xl border border-[#d6ad56]/15 bg-[#171716] p-5 sm:p-6">
            <h2 className="text-base font-semibold">خلاصه سفارش</h2>
            <div className="mt-5 space-y-3 border-b border-white/[0.07] pb-5 text-sm">
              <SummaryLine label="تعداد محصولات" value={itemCount.toLocaleString("fa-IR")} />
              <SummaryLine
                label="وزن کل"
                value={`${totalWeight.toLocaleString("fa-IR")} گرم`}
              />
            </div>
            <div className="flex items-center justify-between gap-3 py-5">
              <span className="text-sm text-[#aaa79b]">جمع کل</span>
              <span className="text-base font-semibold text-[#e2c16d]">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <Link
              className="block rounded-xl bg-[#d6ad56] px-4 py-3 text-center text-sm font-semibold text-[#211a0d] transition hover:bg-[#e2bf70]"
              href="/checkout"
            >
              ادامه و ثبت سفارش
            </Link>
            <Link
              className="mt-4 block text-center text-xs text-[#898578] hover:text-[#e2c16d]"
              href={`/${items[0].tenantSlug}`}
            >
              بازگشت به فروشگاه
            </Link>
          </aside>
        </div>
      ) : (
        <section className="mt-8 rounded-2xl border border-white/[0.07] bg-[#171716] px-5 py-16 text-center">
          <span className="text-4xl text-[#d6ad56]/70" aria-hidden="true">
            ◇
          </span>
          <h2 className="mt-4 text-lg font-semibold">سبد خرید شما خالی است</h2>
          <p className="mt-2 text-sm text-[#858378]">
            برای شروع، محصولات کالکشن فروشگاه را ببینید.
          </p>
          <Link
            className="mt-6 inline-flex rounded-xl bg-[#d6ad56] px-5 py-3 text-sm font-semibold text-[#211a0d] hover:bg-[#e2bf70]"
            href={`/${DEFAULT_STORE_SLUG}`}
          >
            مشاهده محصولات
          </Link>
        </section>
      )}
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-[#858378]">{label}</span>
      <span className="text-[#c5c1b6]">{value}</span>
    </div>
  );
}

function formatPrice(value: number): string {
  return `${value.toLocaleString("fa-IR")} تومان`;
}
