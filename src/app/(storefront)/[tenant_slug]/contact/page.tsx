import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/storefront-data";
import ContactContent from "../../contact/contact-content";

export default async function TenantContactPage({
  params,
}: {
  params: Promise<{ tenant_slug: string }>;
}) {
  const { tenant_slug: slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();
  return <ContactContent store={store} />;
}
