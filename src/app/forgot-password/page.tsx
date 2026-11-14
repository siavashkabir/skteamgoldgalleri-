import ForgotPasswordForm from "./forgot-password-form";


export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[#10100f] px-5 py-16 text-[#f5f2e9]">
      <section className="mx-auto max-w-md rounded-3xl border border-white/[0.08] bg-[#171716] p-7 sm:p-10">
        <h1 className="text-2xl font-semibold">فراموشی رمز عبور</h1>
        <p className="mb-7 mt-3 text-sm leading-7 text-[#969387]">
          برای مشتریان و مدیران فروشگاه؛ لینک بازنشانی به ایمیل حساب ارسال می‌شود.
        </p>
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
