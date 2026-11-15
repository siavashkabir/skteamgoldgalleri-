"use client";

import { useActionState, useState } from "react";
import {
  deleteMasterTool,
  saveMasterTool,
  type TenantActionState,
} from "../actions";

export type MasterTool = {
  id: string;
  name: string;
  url: string;
  icon: string;
  order: number;
};

const initialState: TenantActionState = {};

export default function MasterToolsManager({
  tools,
}: {
  tools: MasterTool[];
}) {
  const [editing, setEditing] = useState<MasterTool | null>(null);
  const [state, action, pending] = useActionState(saveMasterTool, initialState);

  function startCreate() {
    setEditing({ id: "", name: "", url: "", icon: "", order: tools.length + 1 });
  }

  return (
    <div className="mt-7 space-y-6">
      <button
        className="rounded-xl bg-[#d6ad56] px-4 py-3 text-sm font-semibold text-[#211a0d]"
        onClick={startCreate}
        type="button"
      >
        افزودن ابزار
      </button>
      {editing ? (
        <form action={action} className="grid gap-4 rounded-2xl border border-white/[0.08] bg-[#171716] p-5 sm:grid-cols-2" key={editing.id || "new-tool"}>
          <input name="id" type="hidden" value={editing.id} />
          <label className="text-sm text-[#c5c1b6]">
            نام ابزار
            <input className={inputClass} defaultValue={editing.name} maxLength={100} name="name" required />
          </label>
          <label className="text-sm text-[#c5c1b6]">
            آیکن / ایموجی
            <input className={inputClass} defaultValue={editing.icon} maxLength={20} name="icon" required />
          </label>
          <label className="text-sm text-[#c5c1b6] sm:col-span-2">
            نشانی URL
            <input className={inputClass} defaultValue={editing.url} name="url" required type="url" />
          </label>
          <label className="text-sm text-[#c5c1b6]">
            ترتیب نمایش
            <input className={inputClass} defaultValue={editing.order} min={0} name="order" required type="number" />
          </label>
          {state.error || state.success ? (
            <p className={`self-end text-sm ${state.error ? "text-red-300" : "text-emerald-300"}`} role={state.error ? "alert" : "status"}>
              {state.error ?? state.success}
            </p>
          ) : null}
          <div className="flex gap-3 sm:col-span-2">
            <button className="rounded-xl bg-[#d6ad56] px-4 py-2.5 text-sm font-semibold text-[#211a0d] disabled:opacity-60" disabled={pending} type="submit">
              {pending ? "در حال ذخیره..." : "ذخیره ابزار"}
            </button>
            <button className="rounded-xl border border-white/10 px-4 py-2.5 text-sm" onClick={() => setEditing(null)} type="button">
              لغو
            </button>
          </div>
        </form>
      ) : null}
      {tools.length ? (
        <ul className="space-y-3">
          {tools.map((tool) => (
            <li className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-[#171716] p-4" key={tool.id}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-2xl">{tool.icon}</span>
                <span className="min-w-0">
                  <span className="block font-medium">{tool.name}</span>
                  <span className="block truncate text-xs text-[#858378]" dir="ltr">{tool.url}</span>
                </span>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#e2c16d]" onClick={() => setEditing(tool)} type="button">
                  ویرایش
                </button>
                <form action={deleteMasterTool}>
                  <input name="id" type="hidden" value={tool.id} />
                  <button className="rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300" type="submit">
                    حذف
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-white/[0.07] bg-[#171716] p-5 text-sm text-[#858378]">
          هنوز ابزاری اضافه نشده است.
        </p>
      )}
    </div>
  );
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-white/[0.09] bg-[#10100f] px-3 text-sm text-[#f5f2e9] outline-none focus:border-[#d6ad56]/60";
