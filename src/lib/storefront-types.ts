import type { ThemeSettings } from "@/lib/theme-settings";
import type { TenantModule } from "@/lib/tenant-modules";

export const DEFAULT_TENANT_ID = "team-gold-system";
export const DEFAULT_STORE_SLUG = "skteam";

export type StorefrontStore = {
  show_header_widget?: number | boolean | null;
  show_chart?: number | boolean | null;
  chart_type?: string | null;
  chart_color?: string | null;
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
  themeSettings: ThemeSettings;
  status: "active" | "trial" | "suspended";
  expiryDate: string | null;
  templateId: "luxury" | "minimal" | "classic" | "medical" | "tourism" | "corporate";
  businessType: string | null;
  enabledModules: TenantModule[];
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
  customFields: Record<string, string>;
  images: string[];
  ratingAverage: number | null;
  ratingCount: number;
};
