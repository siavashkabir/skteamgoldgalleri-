import type { ReactNode } from "react";
import StorefrontDefaultLayout from "../storefront-default-layout";
import { getCustomerContext } from "@/lib/admin-context";

export default async function CheckoutLayout({ children }: { children: ReactNode }) {
  await getCustomerContext();
  return <StorefrontDefaultLayout>{children}</StorefrontDefaultLayout>;
}
