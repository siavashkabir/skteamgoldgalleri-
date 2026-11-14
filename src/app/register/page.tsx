import Link from "next/link";
import RegisterForm from "./register-form";

export const runtime = "edge";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#10100f] px-5 py-12 text-[#f5f2e9]">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/[0.08] bg-[#171716] p-6 sm:p-10">
        <Link className="text-sm text-[#e2c16d]" href="/">گالری طلای امیر</Link>
        <h1 className="mt-6 text-2xl font-semibold">ساخت حساب مشتری</h1>
        <p className="mb-7 mt-2 text-sm text-[#969387]">اطلاعات خود را دقیق و مطابق مدارک هویتی وارد کنید.</p>
        <RegisterForm />
      </div>
    </main>
  );
}
