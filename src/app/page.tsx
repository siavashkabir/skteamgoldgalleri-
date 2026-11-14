import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedProfile } from "@/lib/admin-context";

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#10100f]" />}>
      <HomeRedirect />
    </Suspense>
  );
}

async function HomeRedirect() {
  const { role } = await getAuthenticatedProfile();
  return redirect(
    role === "customer"
      ? "/profile"
      : role === "super_admin"
        ? "/master-admin"
        : "/admin",
  );
}
