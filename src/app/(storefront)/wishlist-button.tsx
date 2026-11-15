"use client";

import { useState } from "react";
import { setWishlistState } from "./wishlist-actions";

export default function WishlistButton({
  productId,
  isSaved,
  loginPath,
}: {
  productId: string;
  isSaved: boolean;
  loginPath: string;
}) {
  const [saved, setSaved] = useState(isSaved);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setPending(true);
    setError("");
    try {
      await setWishlistState(productId, !saved);
      setSaved(!saved);
    } catch {
      setError("ذخیره علاقه‌مندی انجام نشد. دوباره تلاش کنید.");
    } finally {
      setPending(false);
    }
  }

  const className =
    "absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[var(--color-bg)]/85 text-lg text-[var(--color-primary)] backdrop-blur transition hover:border-[var(--color-primary)]/50 disabled:opacity-50";
  const icon = (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"}>
      <path d="M20.8 8.7c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11a4.7 4.7 0 0 1 8.8-2.2 4.7 4.7 0 0 1 8.8 2.2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );

  return (
    <>
      <button
        aria-label={
          loginPath
            ? "برای افزودن به علاقه‌مندی‌ها وارد شوید"
            : saved
              ? "حذف از علاقه‌مندی‌ها"
              : "افزودن به علاقه‌مندی‌ها"
        }
        aria-pressed={!loginPath && saved}
        className={className}
        disabled={pending}
        onClick={() => {
          if (loginPath) window.location.assign(loginPath);
          else void toggle();
        }}
        type="button"
      >
        {icon}
      </button>
      {error ? <span className="sr-only" role="status">{error}</span> : null}
    </>
  );
}
