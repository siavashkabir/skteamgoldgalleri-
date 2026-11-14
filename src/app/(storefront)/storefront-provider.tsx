"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { StorefrontProduct } from "@/lib/storefront-types";

const storageKey = "amir-gold-storefront-cart-v1";
const emptySnapshot = "[]";
const cartListeners = new Set<() => void>();

export type CartItem = {
  productId: string;
  tenantId: string;
  tenantSlug: string;
  name: string;
  price: number;
  weight: number | null;
  imageUrl: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  totalWeight: number;
  addItem: (
    product: StorefrontProduct,
    tenantId: string,
    tenantSlug: string,
  ) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    getServerCartSnapshot,
  );
  const items = useMemo(() => parseCart(snapshot), [snapshot]);

  const addItem = useCallback(
    (product: StorefrontProduct, tenantId: string, tenantSlug: string) => {
      const price = product.price;
      if (price === null || !Number.isFinite(price) || price <= 0) {
        return;
      }
      updateCart((current) => {
        const existing = current.find(
          (item) =>
            item.productId === product.id && item.tenantId === tenantId,
        );
        if (existing) {
          return current.map((item) =>
            item === existing
              ? { ...item, quantity: Math.min(item.quantity + 1, 20) }
              : item,
          );
        }
        return [
          ...current,
          {
            productId: product.id,
            tenantId,
            tenantSlug,
            name: product.name,
            price,
            weight: product.weight,
            imageUrl: product.imageUrl,
            quantity: 1,
          },
        ];
      });
    },
    [],
  );

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const safeQuantity = Math.max(1, Math.min(20, Math.trunc(quantity)));
    updateCart((current) =>
      current.map((item) =>
        item.productId === productId
          ? { ...item, quantity: safeQuantity }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    updateCart((current) =>
      current.filter((item) => item.productId !== productId),
    );
  }, []);
  const clearCart = useCallback(() => updateCart(() => []), []);

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
      totalPrice: items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      ),
      totalWeight: items.reduce(
        (total, item) => total + (item.weight ?? 0) * item.quantity,
        0,
      ),
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [addItem, clearCart, items, removeItem, setQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("سبد خرید خارج از محدوده فروشگاه استفاده شده است.");
  }
  return context;
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === "string" &&
    typeof item.tenantId === "string" &&
    typeof item.tenantSlug === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    item.price > 0 &&
    ((typeof item.weight === "number" && Number.isFinite(item.weight)) ||
      item.weight === null) &&
    (typeof item.imageUrl === "string" || item.imageUrl === null) &&
    Number.isInteger(item.quantity) &&
    Number(item.quantity) > 0 &&
    Number(item.quantity) <= 20
  );
}

function subscribeToCart(listener: () => void) {
  cartListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    cartListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getCartSnapshot(): string {
  return window.localStorage.getItem(storageKey) ?? emptySnapshot;
}

function getServerCartSnapshot(): string {
  return emptySnapshot;
}

function parseCart(snapshot: string): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(snapshot);
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

function updateCart(
  updater: (items: CartItem[]) => CartItem[],
) {
  const next = updater(parseCart(getCartSnapshot()));
  window.localStorage.setItem(storageKey, JSON.stringify(next));
  for (const listener of cartListeners) {
    listener();
  }
}
