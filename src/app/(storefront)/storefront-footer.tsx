import Link from "next/link";
import type { StorefrontStore } from "@/lib/storefront-types";

export default function StorefrontFooter({
  store,
}: {
  store: StorefrontStore;
}) {
  const socialLinks = [
    ["اینستاگرام", store.instagramUrl],
    ["تلگرام", store.telegramUrl],
    ["واتساپ", store.whatsappUrl],
  ].flatMap(([label, href]) => {
    const safeHref = safeExternalUrl(href);
    return safeHref ? [{ label, href: safeHref }] : [];
  });

  return (
    <footer className="mt-auto border-t border-white/[0.07] bg-[#131311]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1.4fr_1fr] md:items-center">
        <div>
          <Link
            className="text-base font-semibold text-[#e2c16d]"
            href={`/${store.slug}`}
          >
            {store.name}
          </Link>
          <p className="mt-2 max-w-xl text-sm leading-7 text-[#8f8c81]">
            {store.description ||
              "زیبایی ماندگار طلا را با انتخابی دقیق و تجربه‌ای مطمئن همراه کنید."}
          </p>
        </div>
        <div className="md:text-left">
          <p className="text-xs font-semibold text-[#c5c1b6]">با ما در تماس باشید</p>
          {socialLinks.length ? (
            <div className="mt-3 flex flex-wrap gap-2 md:justify-start">
              {socialLinks.map((link) => (
                <a
                  className="rounded-full border border-white/[0.08] px-3.5 py-2 text-xs text-[#aaa79b] transition hover:border-[#d6ad56]/40 hover:text-[#e2c16d]"
                  href={link.href}
                  key={link.label}
                  rel="noreferrer"
                  target="_blank"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-[#77766e]">
              راه‌های ارتباطی در تنظیمات فروشگاه ثبت نشده است.
            </p>
          )}
        </div>
      </div>
      <div className="border-t border-white/[0.05] px-5 py-4 text-center text-[11px] text-[#6f6d63]">
        © {new Date().getFullYear().toLocaleString("fa-IR")} {store.name} ·
        همه حقوق محفوظ است
      </div>
    </footer>
  );
}

function safeExternalUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
