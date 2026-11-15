import type { ReactNode } from "react";
import StorefrontDefaultLayout from "../storefront-default-layout";

export const dynamic = "force-dynamic";

export default async function CheckoutLayout({ children }: { children: ReactNode }) {
  return <StorefrontDefaultLayout>{children}</StorefrontDefaultLayout>;
}
