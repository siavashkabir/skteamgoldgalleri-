import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getStoreBySlug,
  getStorefrontCatalog,
  getStorefrontCustomerState,
} from "@/lib/storefront-data";
import ProductCatalog from "../product-catalog";
import PriceCalculator from "../price-calculator";
import PriceTrends from "../price-trends";
import TrustBadges from "../trust-badges";
import BookingForm from "./booking-form";

export default function StorefrontPage(props: PageProps<"/[tenant_slug]">) {
  return (
    <Suspense
      fallback={
        <main className="min-h-[65vh] bg-[var(--color-bg)]" aria-busy="true" />
      }
    >
      <StorefrontContent params={props.params} />
    </Suspense>
  );
}

async function StorefrontContent({
  params,
}: {
  params: Promise<{ tenant_slug: string }>;
}) {
  const { tenant_slug: slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }
  const [catalog, customerState] = await Promise.all([
    getStorefrontCatalog(store.id),
    getStorefrontCustomerState(store.id),
  ]);
  const isCorporate =
    store.templateId === "corporate" ||
    store.enabledModules.includes("corporate");
  const hasEcommerce =
    store.enabledModules.includes("ecommerce") && !isCorporate;
  const hasBooking =
    store.enabledModules.includes("booking") ||
    store.enabledModules.includes("tourism");
  const hasGallery = store.enabledModules.includes("gallery");
  
  // 🚨 این خط جدید: تشخیص طلا بودن
  const isGold = store.businessType === "gold";

  const galleryImages = catalog.products.flatMap((product) =>
    [...product.images, ...(product.imageUrl ? [product.imageUrl] : [])].map(
      (src) => ({ src, alt: product.name }),
    ),
  ).filter((image, index, list) =>
    list.findIndex((candidate) => candidate.src === image.src) === index,
  );
  const tourismHeroImage =
    store.themeSettings.bgImageUrl ?? galleryImages[0]?.src ?? null;

  return (
    <div>
      <section className="relative isolate overflow-hidden border-b border-white/[0.06] bg-[var(--color-surface)]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_45%,color-mix(in_srgb,var(--color-primary)_19%,transparent),transparent_38%),linear-gradient(130deg,var(--color-surface)_5%,var(--color-bg)_72%)]" />
        <div className="pointer-events-none absolute -left-24 top-0 -z-10 h-[28rem] w-[28rem] rounded-full border border-[var(--color-primary)]/[0.08] sm:-left-4 sm:top-[-5rem]" />
        <div className="pointer-events-none absolute -left-8 top-16 -z-10 h-[22rem] w-[22rem] rounded-full border border-[var(--color-primary)]/[0.1]" />
        <div className="mx-auto grid min-h-[440px] max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1.15fr_0.85fr] md:py-20 lg:min-h-[520px]">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/[0.07] px-4 py-2 text-xs font-medium text-[var(--color-primary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
              {store.templateId === "medical"
                ? "مراقبت و سلامت"
                : store.templateId === "tourism"
                  ? "مقصد بعدی شما"
                  : isCorporate
                    ? "راهکارهای حرفه‌ای"
                    : isGold
                      ? "اصالت، ظرافت، ماندگاری"
                      : "کیفیت، تنوع و اعتماد"}
            </p>
            <h1 className="text-4xl font-semibold leading-[1.5] tracking-tight text-[var(--color-text)] sm:text-5xl lg:text-6xl">
              {store.heroTitle || store.name}
              {store.heroSubtitle ? (
                <span className="mt-1 block text-[var(--color-primary)]">{store.heroSubtitle}</span>
              ) : (
                <span className="mt-1 block text-[var(--color-primary)]">
                  {store.templateId === "medical"
                    ? "همراه سلامت شما"
                    : store.templateId === "tourism"
                      ? "تجربه‌ای فراموش‌نشدنی"
                      : isCorporate
                        ? "از تخصص تا نتیجه"
                        : isGold
                          ? "زیباییِ ماندگار"
                          : "انتخابی هوشمندانه"}
                </span>
              )}
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-8 text-[#aaa79b] sm:text-base">
              {store.description ||
                (isGold 
                  ? "کالکشن منتخب طلا و جواهر را با دقتی درخور لحظه‌های خاص زندگی کشف کنید."
                  : "محصولات با کیفیت و متنوع را برای نیازهای خود کشف کنید.")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                className="rounded-xl bg-[var(--color-primary)] px-6 py-3.5 text-sm font-semibold text-[var(--color-bg)] shadow-[0_12px_30px_color-mix(in_srgb,var(--color-primary)_13%,transparent)] transition hover:bg-[var(--color-primary)]"
                href={
                  hasEcommerce
                    ? "#products"
                    : hasBooking
                      ? "#booking"
                      : hasGallery
                        ? "#gallery"
                        : `/${store.slug}/contact`
                }
              >
                {hasEcommerce
                  ? "دیدن محصولات"
                  : hasBooking
                    ? "ثبت درخواست"
                    : hasGallery
                      ? "دیدن گالری"
                      : "تماس با ما"}
              </Link>
              <span className="text-xs text-[#858378]">
                انتخابی برای هر روز و هر مناسبت
              </span>
            </div>
          </div>

          <div className="relative mx-auto h-[260px] w-full max-w-[410px] sm:h-[330px]">
            {store.templateId === "tourism" && tourismHeroImage ? (
              <>
                <Image
                  alt={store.name}
                  className="rounded-[2rem] object-cover shadow-2xl"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 410px"
                  src={tourismHeroImage}
                  unoptimized
                />
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-black/70 via-transparent to-black/10" />
                <div className="absolute bottom-5 right-5 rounded-2xl border border-white/20 bg-white/90 p-4 text-slate-900 shadow-xl backdrop-blur">
                  <p className="text-xs font-semibold">{store.name}</p>
                  <p className="mt-1 text-[11px]">مقصد بعدی خود را کشف کنید</p>
                </div>
              </>
            ) : isGold ? (
              <div className="flex h-full items-center justify-center">
                <div className="absolute h-[250px] w-[250px] rounded-full border border-[var(--color-primary)]/20 sm:h-[310px] sm:w-[310px]" />
                <div className="absolute h-[205px] w-[205px] rounded-full border border-[var(--color-primary)]/15 sm:h-[260px] sm:w-[260px]" />
                <div className="absolute h-[150px] w-[150px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-primary)_18%,transparent),color-mix(in_srgb,var(--color-primary)_1.5%,transparent)_68%,transparent_70%)] sm:h-[200px] sm:w-[200px]" />
                <div className="relative flex h-36 w-36 rotate-45 items-center justify-center rounded-[2rem] border border-[var(--color-primary)]/45 bg-gradient-to-br from-[var(--color-primary)]/25 via-[var(--color-surface)]/60 to-[var(--color-surface)] shadow-[0_20px_80px_color-mix(in_srgb,var(--color-primary)_13%,transparent)] sm:h-44 sm:w-44">
                  <span className="-rotate-45 text-7xl font-extralight text-[var(--color-primary)] sm:text-8xl">
                    ◈
                  </span>
                </div>
                <span className="absolute right-[13%] top-[20%] text-xl text-[var(--color-primary)]">✧</span>
                <span className="absolute bottom-[18%] left-[12%] text-sm text-[var(--color-primary)]">✦</span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {hasEcommerce ? <TrustBadges /> : null}

      {hasEcommerce && isGold ? (
        <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1.25fr_0.75fr]">
          <PriceTrends />
          <PriceCalculator />
        </section>
      ) : null}

      {hasEcommerce ? <section
        className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16"
        id="products"
      >
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-[var(--color-primary)]">
              کالکشن فروشگاه
            </p>
            <h2 className="text-2xl font-semibold sm:text-3xl">محصولات منتخب</h2>
          </div>
          <p className="text-xs text-[#858378]">
            {catalog.products.length.toLocaleString("fa-IR")} محصول قابل مشاهده
          </p>
        </div>

        <ProductCatalog
          categories={catalog.categories}
          isCustomer={Boolean(customerState)}
          products={catalog.products}
          store={store}
          wishlistedProductIds={customerState?.wishlistedProductIds}
        />
      </section> : null}

      {hasGallery ? (
        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8" id="gallery">
          <h2 className="mb-6 text-2xl font-semibold">گالری تصاویر</h2>
          {galleryImages.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {galleryImages.map((image, index) => (
                <Image
                  alt={image.alt}
                  className="aspect-square w-full rounded-2xl object-cover"
                  height={480}
                  key={`${image.src}-${index}`}
                  src={image.src}
                  unoptimized
                  width={480}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-white/[0.08] bg-[var(--color-surface)] p-8 text-sm text-[#929085]">
              هنوز تصویری برای نمایش ثبت نشده است.
            </p>
          )}
        </section>
      ) : null}

      {hasBooking ? (
        <section className="border-y border-white/[0.07] bg-[var(--color-surface)]" id="booking">
          <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
            <h2 className="text-2xl font-semibold">
              {store.templateId === "medical" ? "درخواست نوبت" : store.templateId === "tourism" ? "درخواست مشاوره سفر" : "ثبت درخواست"}
            </h2>
            <p className="mb-6 mt-2 text-sm leading-7 text-[#929085]">
              اطلاعات تماس خود را وارد کنید تا برای هماهنگی با شما تماس بگیریم.
            </p>
            <BookingForm tenantSlug={store.slug} />
          </div>
        </section>
      ) : null}

      {hasEcommerce ? <section className="border-y border-white/[0.05] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-[var(--color-text)]">
              انتخابی ارزشمند، تجربه‌ای مطمئن
            </p>
            <p className="mt-1.5 text-xs leading-6 text-[#858378]">
              هر قطعه با توجه به زیبایی و کیفیت انتخاب شده است.
            </p>
          </div>
          <Link
            className="w-fit rounded-xl border border-[var(--color-primary)]/30 px-4 py-2.5 text-xs font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/[0.08]"
            href="/cart"
          >
            رفتن به سبد خرید
          </Link>
        </div>
      </section> : null}
    </div>
  );
}
