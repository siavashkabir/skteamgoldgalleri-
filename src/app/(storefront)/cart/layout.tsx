import type { ReactNode } from "react";
import StorefrontDefaultLayout from "../storefront-default-layout";

export default function CartLayout({ children }: { children: ReactNode }) {
  return <StorefrontDefaultLayout>{children}</StorefrontDefaultLayout>;
}
