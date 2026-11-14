import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#10100f]" />}>
      <LoginPageContent />
    </Suspense>
  );
}

async function LoginPageContent() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    throw error;
  }
  if (data?.claims?.sub) {
    redirect("/");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#10100f] px-5 py-10 sm:px-8">
      <div className="pointer-events-none absolute -right-36 -top-40 h-[28rem] w-[28rem] rounded-full bg-[#b58a36]/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-48 -left-40 h-[32rem] w-[32rem] rounded-full bg-[#9a6d20]/10 blur-[110px]" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#171715] shadow-[0_35px_120px_rgba(0,0,0,0.55)] lg:min-h-[680px] lg:grid-cols-2">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#211d14] p-12 lg:flex xl:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_25%,rgba(214,173,86,0.22),transparent_44%),linear-gradient(145deg,rgba(255,255,255,0.025),transparent_60%)]" />
          <div className="absolute -bottom-36 -right-24 h-[30rem] w-[30rem] rounded-full border border-[#d6ad56]/10" />
          <div className="absolute -bottom-20 -right-8 h-[24rem] w-[24rem] rounded-full border border-[#d6ad56]/15" />
          <div className="absolute bottom-8 right-16 h-[18rem] w-[18rem] rounded-full border border-[#d6ad56]/20" />

          <Brand />

          <div className="relative z-10 max-w-md">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e4c474]/20 bg-[#d6ad56]/10 text-[#e4c474]">
              <SparkleIcon />
            </div>
            <p className="mb-3 text-sm font-medium text-[#d6ad56]">
              مدیریت هوشمند، تجربه‌ای لوکس
            </p>
            <h1 className="text-4xl font-semibold leading-[1.55] tracking-tight text-[#f5f0e2] xl:text-5xl">
              فروشگاه‌های خود را
              <br />
              <span className="text-[#d6ad56]">یک‌جا مدیریت کنید.</span>
            </h1>
            <p className="mt-5 max-w-sm text-base leading-8 text-[#b8b2a3]">
              به پنل مدیریت تیم گلد خوش آمدید؛ جایی برای نظارت ساده‌تر و
              حرفه‌ای‌تر بر کسب‌وکار شما.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 text-xs text-[#8f897a]">
            <span className="h-px w-8 bg-[#d6ad56]/50" />
            <span>ساخته‌شده برای رشد کسب‌وکار شما</span>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-14 xl:px-20">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <Brand />
            </div>
            <div className="mb-9">
              <p className="mb-3 text-sm font-medium text-[#d6ad56]">
                خوش آمدید
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-[#f5f2e9]">
                ورود به حساب کاربری
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#969387]">
                برای ادامه، اطلاعات حساب مدیریت خود را وارد کنید.
              </p>
            </div>
            <LoginForm />
            <p className="mt-9 text-center text-xs leading-6 text-[#777569]">
              با ورود به پنل، امنیت حساب خود را حفظ کنید و از اشتراک‌گذاری
              اطلاعات ورود بپرهیزید.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Brand() {
  return (
    <div className="relative z-10 flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e2c16d]/30 bg-[#d6ad56]/10 text-[#e2c16d]">
        <span className="text-xl font-semibold">ت</span>
      </div>
      <div>
        <p className="text-sm font-semibold tracking-wide text-[#f4eddd]">
          تیم گلد
        </p>
        <p className="mt-0.5 text-[10px] tracking-[0.18em] text-[#9c927a]">
          GALLERY MANAGEMENT
        </p>
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
    >
      <path
        d="M12 2.75 14.2 9.8l7.05 2.2-7.05 2.2L12 21.25 9.8 14.2l-7.05-2.2L9.8 9.8 12 2.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m19 2 .7 2.3L22 5l-2.3.7L19 8l-.7-2.3L16 5l2.3-.7L19 2Z"
        fill="currentColor"
      />
    </svg>
  );
}
