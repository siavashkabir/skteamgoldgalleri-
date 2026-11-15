import Link from "next/link";
import type { StorefrontStore } from "@/lib/storefront-types";
import { getPlatformBranding } from "@/lib/platform-settings";

export default async function StorefrontFooter({
  store,
}: {
  store: StorefrontStore;
}) {
  const platform = await getPlatformBranding();
  const socialLinks = Object.entries({
    ...store.socialLinks,
    instagram: store.socialLinks.instagram || store.instagramUrl || "",
    telegram: store.socialLinks.telegram || store.telegramUrl || "",
    whatsapp: store.socialLinks.whatsapp || store.whatsappUrl || "",
  }).flatMap(([label, href]) => {
    const safeHref = safeExternalUrl(href);
    return safeHref ? [{ label: socialLabel(label), href: safeHref }] : [];
  });
  const mapUrl = safeExternalUrl(store.locationUrl);
  const mapQuery = store.addressText || store.locationUrl || "";
  const navigationQuery = encodeURIComponent(mapQuery);
  const platformUrl = safeExternalUrl(platform.url) || "https://skteam.ir";
  const isCorporate =
    store.templateId === "corporate" ||
    store.enabledModules.includes("corporate");
  const hasEcommerce =
    store.enabledModules.includes("ecommerce") && !isCorporate;

  return (
    <footer className="mt-auto border-t border-white/[0.07] bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1.4fr_1fr] md:items-center">
        <div>
          <Link
            className="text-base font-semibold text-[var(--color-primary)]"
            href={`/${store.slug}`}
          >
            {store.name}
          </Link>
          <p className="mt-2 max-w-xl text-sm leading-7 text-[#8f8c81]">
            {store.description ||
              "زیبایی ماندگار طلا را با انتخابی دقیق و تجربه‌ای مطمئن همراه کنید."}
          </p>
          <nav aria-label="پیوندهای فروشگاه" className="mt-4 flex flex-wrap gap-4 text-xs text-[#aaa79b]">
            <Link className="hover:text-[var(--color-primary)]" href={`/${store.slug}/contact`}>تماس با ما</Link>
            {store.enabledModules.includes("gallery") ? <Link className="hover:text-[var(--color-primary)]" href={`/${store.slug}/custom-order`}>سفارش اختصاصی</Link> : null}
            {hasEcommerce ? <Link className="hover:text-[var(--color-primary)]" href="/wishlist">علاقه‌مندی‌ها</Link> : null}
          </nav>
        </div>
        <div className="space-y-5 md:text-left">
          <div>
            <p className="text-xs font-semibold text-[#c5c1b6]">با ما در تماس باشید</p>
            {store.phoneNumbers.length ? (
              <ul className="mt-3 space-y-2" dir="ltr">
                {store.phoneNumbers.map((phone) => (
                  <li key={phone}>
                    <a className="text-sm text-[#c5c1b6] hover:text-[var(--color-primary)]" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                      {phone}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            {store.addressText ? (
              <p className="mt-3 text-xs leading-6 text-[#aaa79b]">{store.addressText}</p>
            ) : null}
          {socialLinks.length ? (
            <div className="mt-3 flex flex-wrap gap-2 md:justify-start">
              {socialLinks.map((link) => (
                <a
                  className="rounded-full border border-white/[0.08] px-3.5 py-2 text-xs text-[#aaa79b] transition hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
                  href={link.href}
                  key={link.label}
                  rel="noreferrer"
                  target="_blank"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
          </div>
          {mapUrl ? (
            <div className="space-y-3">
              <iframe
                allowFullScreen
                className="h-48 w-full rounded-xl border border-white/[0.08]"
                loading="lazy"
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-popups allow-forms"
                src={mapUrl}
                title={`موقعیت مکانی ${store.name}`}
              />
              <div className="flex flex-wrap gap-2">
                <a className={mapLinkClass} href={`https://waze.com/ul?q=${navigationQuery}`} rel="noreferrer" target="_blank">مسیریابی با Waze</a>
                <a className={mapLinkClass} href={`https://neshan.org/maps?destination=${navigationQuery}`} rel="noreferrer" target="_blank">مسیریابی با نشان</a>
                <a className={mapLinkClass} href={`https://balad.ir/?destination=${navigationQuery}`} rel="noreferrer" target="_blank">مسیریابی با بلد</a>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="border-t border-white/[0.05] px-5 py-4 text-center text-[11px] text-[#6f6d63]">
        © {new Date().getFullYear().toLocaleString("fa-IR")} {store.name} ·
        {" "}همه حقوق محفوظ است ·{" "}
        <a className="text-[#aaa79b] hover:text-[var(--color-primary)]" href={platformUrl} rel="noreferrer" target="_blank">
          طراحی شده توسط {platform.name}
        </a>
      </div>
    </footer>
  );
}

function socialLabel(value: string) {
  return (
    {
      instagram: "اینستاگرام",
      telegram: "تلگرام",
      whatsapp: "واتساپ",
    }[value.toLowerCase()] ?? value
  );
}

const mapLinkClass =
  "rounded-lg border border-white/[0.08] px-3 py-2 text-[11px] text-[#c5c1b6] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]";

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
