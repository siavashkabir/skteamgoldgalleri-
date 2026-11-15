import { notFound } from "next/navigation";
import { getTenantAdminContext } from "@/lib/admin-context";
import { db } from "@/lib/db";
import { updateBookingStatus } from "./actions";

const statuses = ["pending", "confirmed", "completed", "cancelled"] as const;
const labels: Record<(typeof statuses)[number], string> = {
  pending: "در انتظار",
  confirmed: "تأییدشده",
  completed: "تکمیل‌شده",
  cancelled: "لغوشده",
};

export default async function BookingsPage() {
  const context = await getTenantAdminContext();
  if (
    context.role !== "super_admin" &&
    !context.enabledModules.some(
      (module) => module === "booking" || module === "tourism",
    )
  ) {
    notFound();
  }
  const result = await db.execute({
    sql: `SELECT id, name, phone, service_id, booking_date, status
          FROM bookings WHERE tenant_id = ? ORDER BY booking_date DESC`,
    args: [context.tenantId],
  });
  return (
    <section>
      <h1 className="text-2xl font-semibold sm:text-3xl">درخواست‌های رزرو</h1>
      <p className="mt-2 text-sm text-[#969387]">درخواست‌های رزرو و هماهنگی مشتریان</p>
      {result.rows.length ? (
        <div className="mt-6 space-y-3">
          {result.rows.map((row) => {
            const id = String(row.id);
            const status = statuses.includes(row.status as (typeof statuses)[number])
              ? (row.status as (typeof statuses)[number])
              : "pending";
            return (
              <article className="rounded-2xl border border-white/[0.08] bg-[#171716] p-5" key={id}>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{String(row.name)}</h2>
                    <p className="mt-1 text-sm text-[#aaa79b]" dir="ltr">{String(row.phone)}</p>
                    <p className="mt-2 text-xs text-[#969387]">
                      {String(row.service_id || "بدون خدمت مشخص")} · {String(row.booking_date)}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs">{labels[status]}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {statuses.filter((nextStatus) => nextStatus !== status).map((nextStatus) => (
                    <form action={updateBookingStatus} key={nextStatus}>
                      <input name="id" type="hidden" value={id} />
                      <input name="status" type="hidden" value={nextStatus} />
                      <button className="rounded-lg border border-[#d6ad56]/20 px-3 py-2 text-xs text-[#e2c16d]" type="submit">
                        {labels[nextStatus]}
                      </button>
                    </form>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-white/[0.08] bg-[#171716] p-8 text-center text-sm text-[#969387]">هنوز درخواستی ثبت نشده است.</p>
      )}
    </section>
  );
}
