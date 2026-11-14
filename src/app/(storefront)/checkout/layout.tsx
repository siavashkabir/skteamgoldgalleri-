import type { ReactNode } from "react";
import StorefrontDefaultLayout from "../storefront-default-layout";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <StorefrontDefaultLayout>{children}</StorefrontDefaultLayout>;
}
