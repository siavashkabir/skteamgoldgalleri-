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
        <div className="min-h-screen bg-[var(--color-bg)]" aria-busy="true" />
      }
    >
      <StorefrontProvider>{children}</StorefrontProvider>
    </Suspense>
  );
}
