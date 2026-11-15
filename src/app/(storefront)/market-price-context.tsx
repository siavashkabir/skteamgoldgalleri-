"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type MarketPrice = {
  ouncePrice: number;
  dollarPrice: number;
  eighteenKPrice: number;
  globalEighteenKPrice: number;
  bubblePercentage: number;
  euroPrice?: number;
  dirhamPrice?: number;
  liraPrice?: number;
  yuanPrice?: number;
  updatedAt: string;
};

type MarketPriceState = {
  price: MarketPrice | null;
  error: string | null;
};

const MarketPriceContext = createContext<MarketPriceState>({
  price: null,
  error: null,
});

export function MarketPriceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MarketPriceState>({
    price: null,
    error: null,
  });
  
  useEffect(() => {
    let active = true;
    async function refreshPrice() {
      try {
        const response = await fetch("/api/tgju", { cache: "no-store" });
        const result: unknown = await response.json();
        if (!response.ok) {
          const message = result && typeof result === "object" && "error" in result && typeof result.error === "string" ? result.error : "قیمت لحظه‌ای در دسترس نیست.";
          throw new Error(message);
        }
        
        if (active) {
          setState({ 
            price: {
              ...(result as any),
              updatedAt: new Date().toISOString()
            }, 
            error: null 
          });
        }
      } catch (caughtError) {
        if (active) {
          setState({
            price: null,
            error: caughtError instanceof Error ? caughtError.message : "قیمت لحظه‌ای در دسترس نیست.",
          });
        }
      }
    }

    void refreshPrice();
    const intervalId = window.setInterval(() => void refreshPrice(), 5 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <MarketPriceContext.Provider value={state}>
      {children}
    </MarketPriceContext.Provider>
  );
}

export function useMarketPrice() {
  return useContext(MarketPriceContext);
}
