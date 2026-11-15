import { redirect } from "next/navigation";
import { getOptionalCustomerContext } from "@/lib/admin-context";
import { getStoreBySlug } from "@/lib/storefront-data";
import { DEFAULT_TENANT_ID } from "@/lib/storefront-types";
import CustomOrderContent from "./custom-order-content";

export default async function CustomOrderPage() {
  const store = await getStoreBySlug(DEFAULT_TENANT_ID);
  if (!store) {
    throw new Error("فروشگاه پیش‌فرض برای ثبت سفارش اختصاصی پیدا نشد.");
  }
  const customer = await getOptionalCustomerContext();
  if (!customer) {
    redirect(`/login?next=${encodeURIComponent("/custom-order")}`);
  }
  if (customer.tenantId !== store.id) {
    redirect(`/${customer.tenantId}/custom-order`);
  }

  return <CustomOrderContent returnPath="/custom-order" />;
}
