import { Suspense, type ReactNode } from "react";
import { StorefrontProvider } from "./storefront-provider";

export default function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#10100f]" aria-busy="true" />
      }
    >
      <StorefrontFrame>{children}</StorefrontFrame>
    </Suspense>
  );
}

async function StorefrontFrame({ children }: { children: ReactNode }) {
  return (
    <StorefrontProvider>
      <div className="min-h-screen bg-[#10100f] text-[#f5f2e9]">
        {children}
      </div>
    </StorefrontProvider>
  );
}
