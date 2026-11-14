import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreBySlug, getVisibleProduct } from "@/lib/storefront-data";
import AddToCartButton from "../../../product-actions";
import ProductDescription from "../../../product-description";


export default function ProductDetailsPage(
  props: PageProps<"/[tenant_slug]/products/[productId]">,
) {
  return (
    <Suspense
      fallback={
        <main className="min-h-[65vh] bg-[#10100f]" aria-busy="true" />
      }
    >
      <ProductDetailsContent params={props.params} />
    </Suspense>
  );
}

async function ProductDetailsContent({
  params,
}: {
  params: Promise<{ tenant_slug: string; productId: string }>;
}) {
  const { tenant_slug: slug, productId } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }
  const product = await getVisibleProduct(store.id, productId);
  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
      <nav className="mb-7 flex items-center gap-2 text-xs text-[#858378]">
        <Link className="transition hover:text-[#e2c16d]" href={`/${store.slug}`}>
          فروشگاه
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-[#c5c1b6]">{product.name}</span>
      </nav>

      <article className="grid overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[#171716] md:grid-cols-2">
        <div className="relative min-h-[320px] bg-[radial-gradient(ellipse_at_50%_45%,rgba(214,173,86,0.14),rgba(255,255,255,0.01)_65%)] sm:min-h-[460px]">
          {product.imageUrl ? (
            <Image
              alt={product.name}
              className="object-cover"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              src={product.imageUrl}
              unoptimized
            />
          ) : (
            <div className="flex min-h-[320px] h-full items-center justify-center sm:min-h-[460px]">
              <span className="text-8xl font-extralight text-[#d6ad56]/60">
                ◈
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col p-6 sm:p-9 lg:p-12">
          <p className="text-xs font-medium text-[#d6ad56]">
            {product.categoryName || "کالکشن گالری"}
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-relaxed sm:text-3xl">
            {product.name}
          </h1>
          <div className="mt-5 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/[0.08] px-3.5 py-2 text-xs text-[#c5c1b6]">
              وزن:{" "}
              {product.weight === null
                ? "ثبت نشده"
                : `${product.weight.toLocaleString("fa-IR")} گرم`}
            </span>
            <span className="rounded-full border border-white/[0.08] px-3.5 py-2 text-xs text-[#c5c1b6]">
              طلای منتخب
            </span>
          </div>
          <p className="mt-7 text-2xl font-semibold text-[#e2c16d]">
            {product.price !== null &&
            Number.isFinite(product.price) &&
            product.price > 0
              ? formatPrice(product.price)
              : "قیمت استعلام شود"}
          </p>

          <div className="mt-8 border-t border-white/[0.07] pt-6">
            <h2 className="mb-4 text-sm font-semibold text-[#e9e5db]">
              توضیحات محصول
            </h2>
            {product.description ? (
              <ProductDescription description={product.description} />
            ) : (
              <p className="text-sm leading-7 text-[#858378]">
                توضیحات بیشتری برای این محصول ثبت نشده است.
              </p>
            )}
          </div>

          {Object.entries(product.specifications).length ? (
            <section className="mt-6 border-t border-white/[0.07] pt-6">
              <h2 className="mb-3 text-sm font-semibold text-[#e9e5db]">
                مشخصات
              </h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div className="rounded-lg bg-white/[0.03] px-3 py-2" key={key}>
                    <dt className="text-xs text-[#858378]">{key}</dt>
                    <dd className="mt-1 text-[#e9e5db]">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <div className="mt-auto pt-8">
            <AddToCartButton product={product} store={store} />
            <p className="mt-3 text-center text-[11px] leading-5 text-[#77766e]">
              ثبت سفارش به معنی پرداخت آنلاین نیست؛ هماهنگی نهایی پس از ثبت
              سفارش انجام می‌شود.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}

function formatPrice(value: number): string {
  return `${value.toLocaleString("fa-IR")} تومان`;
}
