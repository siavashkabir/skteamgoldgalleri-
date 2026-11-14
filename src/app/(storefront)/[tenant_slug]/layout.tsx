import { notFound } from "next/navigation";
import { getStoreBySlug, getStorefrontCategories } from "@/lib/storefront-data";
import StorefrontFrame from "../storefront-frame";

export default async function TenantStorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant_slug: string }>;
}) {
  const { tenant_slug: slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  const categories = await getStorefrontCategories(store.id);
  return <StorefrontFrame categories={categories} store={store}>{children}</StorefrontFrame>;
}
