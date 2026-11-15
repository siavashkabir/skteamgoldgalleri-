"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitProductReview } from "./review-actions";
import type { AdminActionState } from "@/app/admin/action-state";

const initialState: AdminActionState = {};

export type ProductReview = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export default function ProductReviews({
  productId,
  reviews,
  canReview,
  loginPath,
  average,
  count,
}: {
  productId: string;
  reviews: ProductReview[];
  canReview: boolean;
  loginPath: string;
  average: number | null;
  count: number;
}) {
  const [state, action, pending] = useActionState(
    submitProductReview,
    initialState,
  );

  return (
    <section className="mt-8 border-t border-white/[0.07] pt-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">دیدگاه خریداران</h2>
          <p className="mt-1 text-xs text-[#969387]">
            {average === null
              ? "هنوز امتیازی ثبت نشده است."
              : `${average.toLocaleString("fa-IR", { maximumFractionDigits: 1 })} از ۵ · ${count.toLocaleString("fa-IR")} دیدگاه`}
          </p>
        </div>
        {average !== null ? (
          <span aria-label={`امتیاز ${average} از ۵`} className="text-sm text-[#e2c16d]">
            {"★".repeat(Math.round(average))}{"☆".repeat(5 - Math.round(average))}
          </span>
        ) : null}
      </div>

      {reviews.length ? (
        <ul className="mt-5 space-y-3">
          {reviews.map((review) => (
            <li className="rounded-xl border border-white/[0.06] bg-[#10100f]/70 p-4" key={review.id}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{review.name}</span>
                <span aria-label={`${review.rating} ستاره`} className="text-xs text-[#e2c16d]">
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#c5c1b6]">{review.comment}</p>
              <time className="mt-2 block text-[11px] text-[#77766e]" dateTime={review.createdAt}>
                {formatDate(review.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      ) : null}

      {canReview ? (
        <form action={action} className="mt-5 space-y-3 rounded-xl border border-white/[0.07] p-4">
          <input name="product_id" type="hidden" value={productId} />
          <label className="block text-sm text-[#c5c1b6]">
            امتیاز
            <select className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#10100f] px-3 text-sm" defaultValue="5" name="rating">
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>{rating} ستاره</option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-[#c5c1b6]">
            دیدگاه شما
            <textarea className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-[#10100f] p-3 text-sm" maxLength={2000} name="comment" required rows={3} />
          </label>
          <button className="rounded-lg bg-[#d6ad56] px-4 py-2.5 text-sm font-semibold text-[#211a0d] disabled:opacity-60" disabled={pending} type="submit">
            {pending ? "در حال ثبت..." : "ثبت دیدگاه"}
          </button>
          {state.error || state.success ? (
            <p aria-live="polite" className={`text-sm ${state.error ? "text-red-300" : "text-emerald-300"}`} role={state.error ? "alert" : "status"}>
              {state.error ?? state.success}
            </p>
          ) : null}
        </form>
      ) : loginPath ? (
        <p className="mt-5 text-sm text-[#969387]">
          <Link className="text-[#e2c16d] hover:underline" href={loginPath}>وارد حساب کاربری</Link>
          {" "}شوید؛ فقط خریداران این محصول امکان ثبت دیدگاه دارند.
        </p>
      ) : null}
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(
    new Date(`${value.replace(" ", "T")}Z`),
  );
}
