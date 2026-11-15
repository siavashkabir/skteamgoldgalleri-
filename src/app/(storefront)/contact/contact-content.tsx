import Link from "next/link";
import type { StorefrontStore } from "@/lib/storefront-types";

export default function ContactContent({ store }: { store: StorefrontStore }) {
  const socialLinks = [
    { label: "اینستاگرام", href: safeUrl(store.instagramUrl) },
    { label: "تلگرام", href: safeUrl(store.telegramUrl) },
    { label: "واتساپ", href: safeUrl(store.whatsappUrl) },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));
  const mapUrl = safeUrl(store.locationUrl);
  const query = encodeURIComponent(store.addressText || store.locationUrl || store.name);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <nav className="mb-6 text-xs text-[#858378]">
        <Link className="hover:text-[var(--color-primary)]" href={`/${store.slug}`}>فروشگاه</Link>
        <span aria-hidden="true"> / </span>
        <span className="text-[#c5c1b6]">تماس با ما</span>
      </nav>
      <section className="rounded-2xl border border-white/[0.07] bg-[var(--color-surface)] p-5 sm:p-8">
        <p className="text-xs font-medium text-[var(--color-primary)]">در کنار شما هستیم</p>
        <h1 className="mt-2 text-2xl font-semibold">تماس با {store.name}</h1>
        <div className="mt-7 grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            {store.phoneNumbers.length ? (
              <section>
                <h2 className="text-sm font-semibold">شماره‌های تماس</h2>
                <ul className="mt-3 space-y-2" dir="ltr">
                  {store.phoneNumbers.map((phone) => (
                    <li key={phone}>
                      <a className="text-sm text-[var(--color-primary)] hover:underline" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                        {phone}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {store.addressText ? (
              <section>
                <h2 className="text-sm font-semibold">نشانی</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#c5c1b6]">{store.addressText}</p>
              </section>
            ) : null}
            {socialLinks.length ? (
              <section>
                <h2 className="text-sm font-semibold">شبکه‌های اجتماعی</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {socialLinks.map((link) => (
                    <a className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-[#c5c1b6] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]" href={link.href} key={link.label} rel="noreferrer" target="_blank">
                      {link.label}
                    </a>
                  ))}
                </div>
              </section>
            ) : null}
            {!store.phoneNumbers.length && !store.addressText && !socialLinks.length ? (
              <p className="text-sm text-[#969387]">اطلاعات تماس هنوز ثبت نشده است.</p>
            ) : null}
          </div>
          <div className="space-y-4">
            {mapUrl ? (
              <a className="inline-flex rounded-lg border border-white/[0.1] px-4 py-2.5 text-sm text-[var(--color-primary)] hover:bg-white/[0.04]" href={mapUrl} rel="noreferrer" target="_blank">
                مشاهده موقعیت در نقشه
              </a>
            ) : null}
            {store.addressText || mapUrl ? (
              <section>
                <h2 className="text-sm font-semibold">مسیریابی</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a className={routeButtonClass} href={`https://waze.com/ul?q=${query}&navigate=yes`} rel="noreferrer" target="_blank">مسیریابی با Waze</a>
                  <a className={routeButtonClass} href={`https://neshan.org/maps?destination=${query}`} rel="noreferrer" target="_blank">مسیریابی با نشان</a>
                  <a className={routeButtonClass} href={`https://balad.ir/?destination=${query}`} rel="noreferrer" target="_blank">مسیریابی با بلد</a>
                </div>
              </section>
            ) : (
              <p className="text-sm text-[#969387]">برای نمایش مسیر، نشانی یا لینک نقشه را در تنظیمات فروشگاه ثبت کنید.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const routeButtonClass =
  "rounded-lg border border-[var(--color-primary)]/25 px-3 py-2 text-xs text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/[0.08]";

function safeUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
