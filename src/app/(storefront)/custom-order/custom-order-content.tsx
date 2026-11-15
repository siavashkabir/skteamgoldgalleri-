import Link from "next/link";
import CustomOrderForm from "@/app/profile/custom-order-form";

export default function CustomOrderContent({
  returnPath,
}: {
  returnPath: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <nav className="mb-6 text-xs text-[#858378]">
        <Link className="hover:text-[#e2c16d]" href="/">فروشگاه</Link>
        <span aria-hidden="true"> / </span>
        <span className="text-[#c5c1b6]">سفارش اختصاصی</span>
      </nav>
      <section className="rounded-2xl border border-[#d6ad56]/20 bg-[#171716] p-5 sm:p-8">
        <p className="text-xs font-medium text-[#d6ad56]">طراحی متناسب با سلیقه شما</p>
        <h1 className="mt-2 text-2xl font-semibold">سفارش اختصاصی</h1>
        <p className="mb-6 mt-2 text-sm leading-7 text-[#969387]">
          تصویر طرح دلخواه و توضیحات خود را ارسال کنید تا برای بررسی و هماهنگی با شما تماس بگیریم.
        </p>
        <CustomOrderForm returnPath={returnPath} />
      </section>
    </div>
  );
}
