import ResetPasswordForm from "./reset-password-form";

export const runtime = "edge";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#10100f] px-5 py-16 text-[#f5f2e9]">
      <section className="mx-auto max-w-md rounded-3xl border border-white/[0.08] bg-[#171716] p-7 sm:p-10">
        <h1 className="mb-7 text-2xl font-semibold">تنظیم رمز عبور جدید</h1>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
