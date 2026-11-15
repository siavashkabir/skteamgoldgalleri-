import { notFound, redirect } from "next/navigation";
import { getOptionalCustomerContext } from "@/lib/admin-context";
import { getStoreBySlug } from "@/lib/storefront-data";
import CustomOrderContent from "../../custom-order/custom-order-content";

export default async function TenantCustomOrderPage({
  params,
}: {
  params: Promise<{ tenant_slug: string }>;
}) {
  const { tenant_slug: slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const customer = await getOptionalCustomerContext();
  if (!customer) {
    redirect(
      `/login?next=${encodeURIComponent(`/${store.slug}/custom-order`)}`,
    );
  }
  if (customer.tenantId !== store.id) notFound();

  return <CustomOrderContent returnPath={`/${store.slug}/custom-order`} />;
}
