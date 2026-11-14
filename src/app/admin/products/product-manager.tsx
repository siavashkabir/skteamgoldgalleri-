"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import type { AdminActionState } from "../action-state";
import type { AdminCategory } from "../categories/category-manager";
import { deleteProduct, saveProduct } from "./actions";

export type AdminProduct = {
  id: string;
  name: string;
  price: number;
  weight: number;
  description: string;
  imageUrl: string | null;
  categoryId: string | null;
  isVisible: boolean;
  condition: "new" | "used";
  laborPercentage: number;
  specifications: Record<string, string>;
};

export default function ProductManager({
  categories,
  products,
}: {
  categories: AdminCategory[];
  products: AdminProduct[];
}) {
  return (
    <div className="mt-7 space-y-8">
      <ProductForm categories={categories} />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">فهرست محصولات</h2>
          <span className="text-xs text-[#858378]">
            {products.length.toLocaleString("fa-IR")} محصول
          </span>
        </div>
        {products.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {products.map((product) => (
              <ProductCard
                categories={categories}
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-[#171716] px-5 py-12 text-center text-sm text-[#858378]">
            هنوز محصولی ثبت نشده است.
          </div>
        )}
      </section>
    </div>
  );
}

function ProductForm({
  categories,
  product,
  onCancel,
}: {
  categories: AdminCategory[];
  product?: AdminProduct;
  onCancel?: () => void;
}) {
  const [state, action, pending] = useActionState(saveProduct, {});
  const [specifications, setSpecifications] = useState(
    () => Object.entries(product?.specifications ?? {}).map(([key, value]) => ({ key, value })),
  );

  return (
    <form
      action={action}
      className="rounded-2xl border border-white/[0.08] bg-[#171716] p-5 sm:p-6"
    >
      <h2 className="mb-5 text-base font-semibold">
        {product ? "ویرایش محصول" : "افزودن محصول"}
      </h2>
      {product ? <input name="id" type="hidden" value={product.id} /> : null}
      <input
        name="existing_image_url"
        type="hidden"
        value={product?.imageUrl ?? ""}
      />

      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <label className="block text-sm text-[#c5c1b6] sm:col-span-2">
          نام محصول
          <input
            className={inputClass}
            defaultValue={product?.name}
            maxLength={160}
            name="name"
            placeholder="مثلاً انگشتر طلای ظریف"
            required
          />
        </label>

        <fieldset className="space-y-3 sm:col-span-2">
          <legend className="text-sm text-[#c5c1b6]">مشخصات تکمیلی</legend>
          {specifications.map((specification, index) => (
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" key={index}>
              <input
                aria-label="نام مشخصه"
                className={inputClass}
                defaultValue={specification.key}
                maxLength={80}
                name="specification_keys"
                placeholder="مثلاً برند"
              />
              <input
                aria-label="مقدار مشخصه"
                className={inputClass}
                defaultValue={specification.value}
                maxLength={300}
                name="specification_values"
                placeholder="مثلاً رولکس"
              />
              <button
                className="rounded-xl border border-white/[0.1] px-3 text-xs text-red-300"
                onClick={() => setSpecifications((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                type="button"
              >
                حذف
              </button>
            </div>
          ))}
          <button
            className="text-xs text-[#e2c16d]"
            onClick={() => setSpecifications((current) => [...current, { key: "", value: "" }])}
            type="button"
          >
            افزودن مشخصه
          </button>
        </fieldset>

        <label className="block text-sm text-[#c5c1b6]">
          قیمت (تومان)
          <input
            className={inputClass}
            defaultValue={product?.price}
            min="1"
            name="price"
            required
            step="any"
            type="number"
          />
        </label>
        <label className="block text-sm text-[#c5c1b6]">
          وزن (گرم)
          <input
            className={inputClass}
            defaultValue={product?.weight}
            min="0.01"
            name="weight"
            required
            step="any"
            type="number"
          />
        </label>

        <label className="block text-sm text-[#c5c1b6]">
          وضعیت کالا
          <select
            className={inputClass}
            defaultValue={product?.condition ?? "new"}
            name="condition"
          >
            <option value="new">نو</option>
            <option value="used">کارکرده</option>
          </select>
        </label>
        <label className="block text-sm text-[#c5c1b6]">
          درصد کارمزد
          <input
            className={inputClass}
            defaultValue={product?.laborPercentage ?? 0}
            min="0"
            name="labor_percentage"
            required
            step="any"
            type="number"
          />
        </label>

        <label className="block text-sm text-[#c5c1b6]">
          دسته‌بندی
          <CategorySelect
            categories={categories}
            defaultValue={product?.categoryId ?? ""}
          />
        </label>
        <label className="block text-sm text-[#c5c1b6]">
          تصویر محصول (حداکثر ۵ مگابایت)
          <input
            accept="image/jpeg,image/png,image/webp,image/avif"
            className={`${inputClass} h-auto py-2`}
            name="image"
            type="file"
          />
        </label>

        {product?.imageUrl ? (
          <label className="flex items-center gap-2 text-xs text-[#aaa79b] sm:col-span-2">
            <input name="clear_image" type="checkbox" />
            حذف تصویر فعلی
          </label>
        ) : null}

        <label className="block text-sm text-[#c5c1b6] sm:col-span-2">
          توضیحات محصول (Markdown)
          <textarea
            className={`${inputClass} min-h-32 resize-y py-3 leading-7`}
            defaultValue={product?.description}
            maxLength={20000}
            name="description"
            placeholder={"## مشخصات محصول\n- عیار: ۱۸\n- مناسب برای استفاده روزمره"}
            rows={5}
          />
          <span className="mt-1 block text-xs text-[#77766e]">
            متن Markdown، از جمله عنوان‌ها و فهرست‌ها، ذخیره می‌شود.
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm text-[#c5c1b6] sm:col-span-2">
          <input
            defaultChecked={product?.isVisible ?? true}
            name="is_visible"
            type="checkbox"
          />
          نمایش محصول در فروشگاه
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button className={buttonClass} disabled={pending} type="submit">
          {pending ? "در حال ذخیره..." : product ? "ذخیره تغییرات" : "افزودن محصول"}
        </button>
        {onCancel ? (
          <button
            className="rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm text-[#c5c1b6]"
            onClick={onCancel}
            type="button"
          >
            انصراف
          </button>
        ) : null}
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

function ProductCard({
  categories,
  product,
}: {
  categories: AdminCategory[];
  product: AdminProduct;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(deleteProduct, {});

  return (
    <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#171716]">
      {editing ? (
        <div className="p-4 sm:p-5">
          <ProductForm
            categories={categories}
            onCancel={() => setEditing(false)}
            product={product}
          />
        </div>
      ) : (
        <div className="flex gap-4 p-4 sm:p-5">
          {product.imageUrl ? (
            <Image
              alt={product.name}
              className="h-24 w-24 shrink-0 rounded-xl object-cover"
              height={96}
              src={product.imageUrl}
              unoptimized
              width={96}
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-2xl text-[#d6ad56]">
              ◈
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="mt-1 text-xs text-[#858378]">
                  {categories.find((category) => category.id === product.categoryId)?.name ??
                    "بدون دسته‌بندی"}
                  {" · "}
                  {product.condition === "new" ? "نو" : "کارکرده"}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] ${
                  product.isVisible
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-white/[0.06] text-[#aaa79b]"
                }`}
              >
                {product.isVisible ? "نمایش داده می‌شود" : "پنهان"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#aaa79b]">
              <span>{product.price.toLocaleString("fa-IR")} تومان</span>
              <span>{product.weight.toLocaleString("fa-IR")} گرم</span>
              <span>کارمزد {product.laborPercentage.toLocaleString("fa-IR")}٪</span>
            </div>
            {Object.keys(product.specifications).length ? (
              <p className="mt-2 text-xs text-[#858378]">
                {Object.entries(product.specifications).map(([key, value]) => `${key}: ${value}`).join(" · ")}
              </p>
            ) : null}
            <div className="mt-4 flex gap-4">
              <button
                className="text-xs text-[#d6ad56] hover:text-[#f0d48f]"
                onClick={() => setEditing(true)}
                type="button"
              >
                ویرایش
              </button>
              <form action={action}>
                <input name="id" type="hidden" value={product.id} />
                <button
                  className="text-xs text-red-300 hover:text-red-200"
                  disabled={pending}
                  type="submit"
                >
                  {pending ? "..." : "حذف"}
                </button>
              </form>
            </div>
            <ActionMessage state={state} />
          </div>
        </div>
      )}
    </article>
  );
}

function CategorySelect({
  categories,
  defaultValue,
}: {
  categories: AdminCategory[];
  defaultValue: string;
}) {
  return (
    <select className={inputClass} defaultValue={defaultValue} name="category_id">
      <option value="">بدون دسته‌بندی</option>
      {flattenCategories(categories).map(({ category, depth }) => (
        <option key={category.id} value={category.id}>
          {"　".repeat(depth)}{category.name}
        </option>
      ))}
    </select>
  );
}

function flattenCategories(categories: AdminCategory[]) {
  const children = new Map<string | null, AdminCategory[]>();
  const knownIds = new Set(categories.map((category) => category.id));
  for (const category of categories) {
    const parentId = category.parentId && knownIds.has(category.parentId)
      ? category.parentId
      : null;
    children.set(parentId, [...(children.get(parentId) ?? []), category]);
  }
  const result: Array<{ category: AdminCategory; depth: number }> = [];
  function visit(parentId: string | null, depth: number, visited: Set<string>) {
    for (const category of children.get(parentId) ?? []) {
      if (visited.has(category.id)) continue;
      result.push({ category, depth });
      visit(category.id, depth + 1, new Set([...visited, category.id]));
    }
  }
  visit(null, 0, new Set());
  return result;
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
