import { getStoreBySlug } from "@/lib/storefront-data";
import { DEFAULT_TENANT_ID } from "@/lib/storefront-types";
import ContactContent from "./contact-content";

export default async function ContactPage() {
  const store = await getStoreBySlug(DEFAULT_TENANT_ID);
  if (!store) {
    throw new Error("فروشگاه پیش‌فرض برای نمایش اطلاعات تماس پیدا نشد.");
  }
  return <ContactContent store={store} />;
}
