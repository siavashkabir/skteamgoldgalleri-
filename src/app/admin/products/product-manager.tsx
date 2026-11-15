import { requireTenantModule } from "@/lib/admin-context";
import { resolveBusinessKind } from "@/lib/tenant-features";
import type { AdminCategory } from "../categories/category-manager";
import ProductManagerClient, {
  type AdminProduct,
} from "./product-manager-client";

export type { AdminProduct } from "./product-manager-client";

export default async function ProductManager({
  categories,
  products,
}: {
  categories: AdminCategory[];
  products: AdminProduct[];
}) {
  const context = await requireTenantModule("ecommerce");
  const businessKind = resolveBusinessKind(
    context.businessType,
    context.enabledModules,
  );
  return (
    <ProductManagerClient
      businessKind={businessKind}
      categories={categories}
      products={products}
    />
  );
}
