export const DEFAULT_TENANT_ID = "team-gold-system";
export const DEFAULT_STORE_SLUG = "skteam";

export type StorefrontStore = {
  id: string;
  slug: string;
  name: string;
  description: string;
  instagramUrl: string | null;
  telegramUrl: string | null;
  whatsappUrl: string | null;
  logoUrl: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  phoneNumbers: string[];
  addressText: string | null;
  locationUrl: string | null;
  socialLinks: Record<string, string>;
  tomanRate: number | null;
};

export type StorefrontCategory = {
  id: string;
  name: string;
  parentId: string | null;
  slug: string;
};

export type StorefrontProduct = {
  id: string;
  name: string;
  price: number | null;
  weight: number | null;
  description: string;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  specifications: Record<string, string>;
};
