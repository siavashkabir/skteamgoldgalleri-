import type { StorefrontCategory } from "./storefront-types";

export type GenderFilter = "men" | "women";

export function genderFilterForName(name: string): GenderFilter | null {
  if (/مرد|آقایان?|\b(?:men|male)\b/i.test(name)) return "men";
  if (/زن|بانوان?|\b(?:women|female)\b/i.test(name)) return "women";
  return null;
}

export function categoryFilterValue(category: StorefrontCategory): string {
  return genderFilterForName(category.name) ?? category.slug;
}
