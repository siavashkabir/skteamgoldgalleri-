const badges = [
  {
    icon: "authenticity",
    title: "ضمانت اصالت",
    description: "تضمین کیفیت و اصالت انتخاب شما",
  },
  {
    icon: "shipping",
    title: "ارسال امن",
    description: "بسته‌بندی مطمئن و ارسال قابل پیگیری",
  },
  {
    icon: "support",
    title: "پشتیبانی ۲۴ ساعته",
    description: "همراه شما برای پاسخ به پرسش‌ها",
  },
];

export default function TrustBadges() {
  return (
    <section aria-label="تعهدهای فروشگاه" className="border-y border-white/[0.06] bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-7xl gap-3 px-5 py-6 sm:grid-cols-3 sm:px-8 sm:py-8">
        {badges.map((badge) => (
          <article className="flex items-center gap-4 rounded-xl border border-white/[0.05] bg-white/[0.015] p-4" key={badge.title}>
            <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/[0.07] text-xl text-[var(--color-primary)]">
              <TrustIcon name={badge.icon} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text)]">{badge.title}</h2>
              <p className="mt-1 text-xs text-[#858378]">{badge.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrustIcon({ name }: { name: string }) {
  if (name === "authenticity") {
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path d="M12 3 19 6v5c0 4.5-2.9 8-7 10-4.1-2-7-5.5-7-10V6l7-3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="m8.5 12 2.2 2.2 4.8-4.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    );
  }
  if (name === "shipping") {
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        <circle cx="7.5" cy="18" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17.5" cy="18" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path d="M4 13v-1a8 8 0 0 1 16 0v1M4 13h3v6H6a2 2 0 0 1-2-2v-4Zm16 0h-3v6h1a2 2 0 0 0 2-2v-4Zm0 5c0 2-1.5 3-4 3h-2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}
