import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getOptionalAuthenticatedProfile } from "@/lib/admin-context";
import { DEFAULT_STORE_SLUG } from "@/lib/storefront-types";


export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#10100f]" />}>
      <HomeRedirect />
    </Suspense>
  );
}

async function HomeRedirect() {
  const profile = await getOptionalAuthenticatedProfile();
  if (!profile) {
    redirect(`/${DEFAULT_STORE_SLUG}`);
  }

  return redirect(
    profile.role === "customer"
      ? "/profile"
      : profile.role === "super_admin"
        ? "/master-admin"
        : "/admin",
  );
}
