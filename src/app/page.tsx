import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTenantAdminContext } from "@/lib/admin-context";

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#10100f]" />}>
      <HomeRedirect />
    </Suspense>
  );
}

async function HomeRedirect() {
  const { role } = await getTenantAdminContext();
  return redirect(role === "super_admin" ? "/master-admin" : "/admin");
}
