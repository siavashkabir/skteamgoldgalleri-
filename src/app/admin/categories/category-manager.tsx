"use client";

import { useActionState, useState } from "react";
import type { AdminActionState } from "../action-state";
import { deleteCategory, saveCategory } from "./actions";

export type AdminCategory = {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder?: number;
};

type NestedCategory = AdminCategory & { depth: number };

export default function CategoryManager({
  categories,
  flattened,
}: {
  categories: AdminCategory[];
  flattened: NestedCategory[];
}) {
  const [state, action, pending] = useActionState(saveCategory, {});

  return (
    <section className="mt-7 space-y-6">
      <form
        action={action}
        className="rounded-2xl border border-white/[0.08] bg-[#171716] p-5 sm:p-6"
      >
        <h2 className="mb-4 text-base font-semibold">افزودن دسته‌بندی</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm text-[#c5c1b6]">
            نام دسته‌بندی
            <input
              className={inputClass}
              maxLength={100}
              name="name"
              placeholder="مثلاً انگشتر"
              required
            />
          </label>
          <label className="block text-sm text-[#c5c1b6]">
            دسته‌بندی والد
            <ParentSelect categories={categories} />
          </label>
          <label className="block text-sm text-[#c5c1b6]">
            ترتیب نمایش
            <input className={inputClass} defaultValue={0} name="sort_order" type="number" required />
          </label>
        </div>
        <SubmitButton pending={pending} label="افزودن دسته‌بندی" />
        <ActionMessage state={state} />
      </form>

      <div className="rounded-2xl border border-white/[0.08] bg-[#171716]">
        <div className="border-b border-white/[0.07] px-5 py-4">
          <h2 className="font-semibold">
            فهرست دسته‌بندی‌ها
            <span className="mr-2 text-xs font-normal text-[#858378]">
              {categories.length.toLocaleString("fa-IR")}
            </span>
          </h2>
        </div>
        {flattened.length ? (
          <div className="divide-y divide-white/[0.055]">
            {flattened.map((category) => (
              <CategoryRow
                categories={categories}
                category={category}
                key={category.id}
              />
            ))}
          </div>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-[#858378]">
            هنوز دسته‌بندی ثبت نشده است.
          </p>
        )}
      </div>
    </section>
  );
}

function CategoryRow({
  categories,
  category,
}: {
  categories: AdminCategory[];
  category: NestedCategory;
}) {
  const [editing, setEditing] = useState(false);
  const [saveState, saveAction, saving] = useActionState(saveCategory, {});
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteCategory,
    {},
  );

  return (
    <div className="px-5 py-4" style={{ paddingRight: `${20 + category.depth * 22}px` }}>
      {editing ? (
        <form action={saveAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <input name="id" type="hidden" value={category.id} />
          <input
            className={inputClass}
            defaultValue={category.name}
            maxLength={100}
            name="name"
            required
          />
          <ParentSelect
            categories={categories}
            defaultValue={category.parentId ?? ""}
          />
          <button className={buttonClass} disabled={saving} type="submit">
            {saving ? "..." : "ذخیره"}
          </button>
          <button
            className="text-xs text-[#aaa79b] sm:col-span-3 sm:justify-self-start"
            onClick={() => setEditing(false)}
            type="button"
          >
            انصراف
          </button>
          <ActionMessage state={saveState} />
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[#d6ad56]" aria-hidden="true">
              {category.depth > 0 ? "↳" : "◇"}
            </span>
            <span className="text-sm font-medium">{category.name}</span>
            {category.parentId ? (
              <span className="text-xs text-[#77766e]">
                زیرمجموعه {categories.find((item) => item.id === category.parentId)?.name}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <button
              className="text-xs text-[#d6ad56] hover:text-[#f0d48f]"
              onClick={() => setEditing(true)}
              type="button"
            >
              ویرایش
            </button>
            <form action={deleteAction}>
              <input name="id" type="hidden" value={category.id} />
              <button
                className="text-xs text-red-300 hover:text-red-200"
                disabled={deleting}
                type="submit"
              >
                {deleting ? "..." : "حذف"}
              </button>
            </form>
          </div>
          <ActionMessage state={deleteState} />
        </div>
      )}
    </div>
  );
}

function ParentSelect({
  categories,
  defaultValue,
}: {
  categories: AdminCategory[];
  defaultValue?: string;
}) {
  return (
    <select
      className={inputClass}
      defaultValue={defaultValue ?? ""}
      name="parent_id"
    >
      <option value="">بدون والد (دسته اصلی)</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button className={`${buttonClass} mt-4`} disabled={pending} type="submit">
      {pending ? "در حال ذخیره..." : label}
    </button>
  );
}

function ActionMessage({ state }: { state: AdminActionState }) {
  if (!state.error && !state.success) {
    return null;
  }
  return (
    <p
      aria-live="polite"
      className={`mt-3 text-sm ${state.error ? "text-red-300" : "text-emerald-300"}`}
      role={state.error ? "alert" : "status"}
    >
      {state.error ?? state.success}
    </p>
  );
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-white/[0.09] bg-[#10100f] px-3 text-sm text-[#f5f2e9] outline-none focus:border-[#d6ad56]/60";
const buttonClass =
  "rounded-xl bg-[#d6ad56] px-4 py-2.5 text-sm font-semibold text-[#211a0d] transition hover:bg-[#e2bf70] disabled:opacity-60";
