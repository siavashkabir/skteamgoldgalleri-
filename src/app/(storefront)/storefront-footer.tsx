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
    
    <div className="flex items-center justify-center gap-4 mt-6">
      {store.instagramUrl && (
        <a href={store.instagramUrl} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-primary)]/30 bg-black/20 text-[var(--color-text)] transition hover:bg-[var(--color-primary)] hover:text-black">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
        </a>
      )}
      {store.whatsappUrl && (
        <a href={store.whatsappUrl} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-primary)]/30 bg-black/20 text-[var(--color-text)] transition hover:bg-[var(--color-primary)] hover:text-black">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
      )}
      {store.telegramUrl && (
        <a href={store.telegramUrl} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-primary)]/30 bg-black/20 text-[var(--color-text)] transition hover:bg-[var(--color-primary)] hover:text-black">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
        </a>
      )}
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
