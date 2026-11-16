import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import LoginForm from "./login-form";


export default function LoginPage(props: PageProps<"/login">) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#10100f]" />}>
      <LoginPageContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function LoginPageContent({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
    expired?: string | string[];
  }>;
}) {
  const query = await searchParams;
  const nextPath = safeNextPath(query.next);
  const tenantSlug = getTenantSlugFromPath(nextPath);
  const registerHref = tenantSlug
    ? `/register?tenant=${encodeURIComponent(tenantSlug)}`
    : "/register";
  const accessDenied =
    (Array.isArray(query.error) ? query.error[0] : query.error) ===
    "access_denied";
  const expired = Boolean(
    Array.isArray(query.expired) ? query.expired[0] : query.expired,
  );
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (
    error &&
    error.status !== 401 &&
    error.name !== "AuthSessionMissingError"
  ) {
    throw error;
  }
  if (!error && data?.claims?.sub && !accessDenied && !expired) {
    redirect(nextPath);
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
              به گالری طلای امیر خوش آمدید؛ تجربه‌ای ساده و حرفه‌ای برای
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
                برای ادامه، با حساب کاربری خود وارد شوید.
              </p>
            </div>
            {accessDenied ? (
              <p
                className="mb-5 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm leading-6 text-red-200"
                role="alert"
              >
                دسترسی رد شد. فقط مالک فروشگاه یا مدیر کل می‌تواند وارد پنل مدیریت شود.
              </p>
            ) : null}
            {expired ? (
              <p
                className="mb-5 rounded-xl border border-[#d6ad56]/20 bg-[#d6ad56]/[0.07] px-4 py-3 text-sm leading-6 text-[#e2c16d]"
                role="status"
              >
                نشست شما به پایان رسید. لطفاً دوباره وارد شوید.
              </p>
            ) : null}
            <LoginForm />
            <div className="mt-5 flex justify-between gap-4 text-xs">
              <Link className="text-[#aaa79b] hover:text-[#e2c16d]" href="/forgot-password">
                فراموشی رمز عبور
              </Link>
              <Link className="text-[#e2c16d] hover:text-[#f0d48f]" href={registerHref}>
                ثبت‌نام مشتری
              </Link>
            </div>
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

function getTenantSlugFromPath(path: string): string | null {
  const slug = path.split("/")[1];
  if (
    !slug ||
    ["admin", "master-admin", "profile", "login", "register", "cart", "checkout", "wishlist", "contact", "custom-order"].includes(slug) ||
    !/^[a-zA-Z0-9-]{1,120}$/.test(slug)
  ) {
    return null;
  }
  return slug;
}

function safeNextPath(value: string | string[] | undefined): string {
  const path = Array.isArray(value) ? value[0] : value;
  return path &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\")
    ? path
    : "/";
}

function Brand() {
  return (
    <div className="relative z-10 flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e2c16d]/30 bg-[#d6ad56]/10 text-[#e2c16d]">
        <span className="text-xl font-semibold">ت</span>
      </div>
      <div>
        <p className="text-sm font-semibold tracking-wide text-[#f4eddd]">
          گالری طلای امیر
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
