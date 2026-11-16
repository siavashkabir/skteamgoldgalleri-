import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#10100f] text-[#f5f2e9]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#d6ad56] mb-4">پلتفرم مدیریت فروشگاه</h1>
        <p className="text-lg mb-8 text-[#c5c1b6]">سیستم جامع مدیریت فروشگاه‌های آنلاین</p>
        <div className="flex gap-4 justify-center">
          <Link href="/login" className="rounded-xl bg-[#d6ad56] px-6 py-3 font-semibold text-[#211a0d] hover:bg-[#e2bf70]">
            ورود به پنل
          </Link>
          <Link href="/skteam" className="rounded-xl border border-[#d6ad56]/30 px-6 py-3 font-semibold text-[#e2c16d] hover:bg-[#d6ad56]/10">
            مشاهده فروشگاه نمونه
          </Link>
        </div>
      </div>
    </main>
  );
}
