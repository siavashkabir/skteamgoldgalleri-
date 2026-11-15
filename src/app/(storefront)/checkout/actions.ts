"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getOptionalCustomerContext } from "@/lib/admin-context";

type CheckoutState = {
  error?: string;
  orderNumber?: string;
};

type SubmittedItem = {
  productId: string;
  quantity: number;
};

type Column = {
  name: string;
  type: string;
  notnull: number;
  dflt_value: unknown;
  pk: number;
};

export async function continueToCheckout(): Promise<never> {
  const customer = await getOptionalCustomerContext();
  redirect(customer ? "/checkout" : "/login");
}

export async function createMockOrder(
  _previousState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const customer = await getOptionalCustomerContext();
  if (!customer) {
    return { error: "برای ثبت سفارش، ابتدا وارد حساب کاربری خود شوید." };
  }

  const name = readText(formData, "customer_name");
  const phone = normalizeDigits(readText(formData, "customer_phone"));
  const city = readText(formData, "shipping_city");
  const address = readText(formData, "shipping_address");
  const postalCode = normalizeDigits(readText(formData, "shipping_postal_code"));

  if (!name || name.length > 120) {
    return { error: "نام و نام خانوادگی را وارد کنید." };
  }
  if (!/^[0-9+()\-\s]{8,25}$/.test(phone)) {
    return { error: "شماره تماس را به‌درستی وارد کنید." };
  }
  if (!city || city.length > 100) {
    return { error: "نام شهر را وارد کنید." };
  }
  if (!address || address.length > 1000) {
    return { error: "نشانی کامل را وارد کنید." };
  }
  if (postalCode && !/^[0-9-]{5,15}$/.test(postalCode)) {
    return { error: "کد پستی معتبر نیست." };
  }

  const submitted = parseItems(readText(formData, "items"));
  if (!submitted) {
    return { error: "سبد خرید معتبر نیست؛ لطفاً محصولات را دوباره بررسی کنید." };
  }
  const productIds = submitted.map((item) => item.productId);
  const productColumnsResult = await db.execute("PRAGMA table_info(products)");
  const productColumns = new Set(
    productColumnsResult.rows.map((row) => String(row.name)),
  );
  const nameColumn = productColumns.has("name") ? "name" : "title";
  const placeholders = productIds.map(() => "?").join(", ");
  const productsResult = await db.execute({
    sql: `SELECT id, tenant_id, ${nameColumn} AS product_name, price, weight
          FROM products
          WHERE id IN (${placeholders}) AND is_visible = 1`,
    args: productIds,
  });
  const products = new Map(
    productsResult.rows.map((row) => [
      String(row.id),
      {
        tenantId: String(row.tenant_id),
        name: String(row.product_name ?? ""),
        price: Number(row.price),
        weight: row.weight === null ? 0 : Number(row.weight),
      },
    ]),
  );
  if (products.size !== submitted.length) {
    return {
      error: "یک یا چند محصول دیگر در فروشگاه موجود یا قابل سفارش نیست.",
    };
  }

  const tenantIds = new Set([...products.values()].map((product) => product.tenantId));
  if (tenantIds.size !== 1) {
    return { error: "برای ثبت سفارش، محصولات باید از یک فروشگاه باشند." };
  }
  const tenantId = [...tenantIds][0];
  const tenantResult = await db.execute({
    sql: "SELECT id, name, status FROM tenants WHERE id = ?",
    args: [tenantId],
  });
  const tenant = tenantResult.rows[0];
  if (!tenant) {
    return { error: "فروشگاه این سبد خرید دیگر در دسترس نیست." };
  }
  if (tenant.status === "suspended") {
    return { error: "این فروشگاه موقتاً بسته است و سفارش جدید نمی‌پذیرد." };
  }
  if (tenantId !== customer.tenantId) {
    return { error: "برای ثبت سفارش، باید وارد حساب مشتری همین فروشگاه شوید." };
  }

  let total = 0;
  for (const item of submitted) {
    const product = products.get(item.productId);
    if (
      !product ||
      !Number.isFinite(product.price) ||
      product.price <= 0 ||
      !Number.isFinite(product.weight)
    ) {
      return {
        error: "قیمت یا وزن یک محصول معتبر نیست؛ لطفاً با فروشگاه تماس بگیرید.",
      };
    }
    total += product.price * item.quantity;
  }

  const [orderColumnsResult, itemColumnsResult] = await Promise.all([
    db.execute("PRAGMA table_info(orders)"),
    db.execute("PRAGMA table_info(order_items)"),
  ]);
  const orderColumns = orderColumnsResult.rows as unknown as Column[];
  const itemColumns = itemColumnsResult.rows as unknown as Column[];
  if (orderColumns.length === 0 || itemColumns.length === 0) {
    throw new Error("جداول سفارش در پایگاه داده آماده نیستند.");
  }
  const requiresShop = orderColumns.some(
    (column) => column.name === "shop_id" && column.notnull === 1,
  );
  const shopsTable = requiresShop
    ? await db.execute(
        `SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'shops'`,
      )
    : { rows: [] };
  const shopResult =
    shopsTable.rows.length > 0
      ? await db.execute({
          sql: `SELECT id FROM shops
                WHERE name = ? OR (SELECT COUNT(*) FROM shops) = 1
                ORDER BY CASE WHEN name = ? THEN 0 ELSE 1 END, id
                LIMIT 1`,
          args: [String(tenant.name), String(tenant.name)],
        })
      : { rows: [] };
  const shopId = shopResult.rows[0]?.id;
  const orderIdColumn = orderColumns.find((column) => column.name === "id");
  const orderId =
    orderIdColumn?.type.toUpperCase().includes("INT")
      ? null
      : crypto.randomUUID();
  const shippingAddress = [address, city, postalCode && `کدپستی ${postalCode}`]
    .filter(Boolean)
    .join("، ");
  const orderValues: Record<string, string | number | null> = {
    id: orderId,
    tenant_id: tenantId,
    customer_id: customer.userId,
    shop_id: shopId === undefined ? null : Number(shopId),
    status: "pending",
    total,
    total_amount: total,
    customer_name: name,
    shipping_name: name,
    customer_phone: phone,
    shipping_phone: phone,
    customer_address: shippingAddress,
    shipping_address: shippingAddress,
    shipping_city: city,
    customer_city: city,
    shipping_postal_code: postalCode || null,
    postal_code: postalCode || null,
    payment_ref: null,
  };

  const orderEntries = supportedEntries(orderColumns, orderValues);
  assertRequiredColumns(orderColumns, orderEntries, "orders");
  if (
    orderColumns.some(
      (column) =>
        column.name === "shop_id" &&
        column.notnull === 1 &&
        shopId === undefined,
    )
  ) {
    throw new Error("برای ثبت سفارش، فروشگاه متناظر در جدول shops پیدا نشد.");
  }

  const itemValues: Array<Record<string, string | number | null>> =
    submitted.map((item) => {
      const product = products.get(item.productId);
      if (!product) {
        throw new Error("محصول سبد خرید پس از بررسی پیدا نشد.");
      }
      return {
        order_id: orderId ?? "__pending_order_id__",
        tenant_id: tenantId,
        customer_id: customer.userId,
        product_id: Number.isFinite(Number(item.productId))
          ? Number(item.productId)
          : item.productId,
        quantity: item.quantity,
        unit_price: product.price,
        price: product.price,
        weight: product.weight,
      };
    });
  for (const values of itemValues) {
    const entries = supportedEntries(itemColumns, values);
    assertRequiredColumns(itemColumns, entries, "order_items");
  }

  const transaction = await db.transaction("write");
  try {
    const insertOrder = await insertRow(
      transaction,
      "orders",
      orderEntries,
    );
    const savedOrderId =
      orderId ?? String(insertOrder.lastInsertRowid ?? "");
    if (!savedOrderId) {
      throw new Error("شناسه سفارش ذخیره‌شده در دسترس نیست.");
    }

    for (let index = 0; index < submitted.length; index += 1) {
      const entries = supportedEntries(itemColumns, {
        ...itemValues[index],
        order_id:
          orderId === null && Number.isFinite(Number(savedOrderId))
            ? Number(savedOrderId)
            : savedOrderId,
      });
      await insertRow(transaction, "order_items", entries);
    }
    await transaction.commit();
    return { orderNumber: savedOrderId };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

function supportedEntries(
  columns: Column[],
  values: Record<string, string | number | null>,
) {
  const available = new Set(columns.map((column) => column.name));
  return Object.entries(values).filter(
    ([name, value]) => available.has(name) && value !== null,
  );
}

function assertRequiredColumns(
  columns: Column[],
  entries: Array<[string, string | number | null]>,
  table: string,
) {
  const provided = new Set(entries.map(([name]) => name));
  const missing = columns.find(
    (column) =>
      column.notnull === 1 &&
      column.pk !== 1 &&
      column.dflt_value === null &&
      !provided.has(column.name),
  );
  if (missing) {
    throw new Error(
      `ثبت سفارش با ساختار فعلی جدول ${table} ممکن نیست؛ ستون ${missing.name} مقداردهی نشده است.`,
    );
  }
}

async function insertRow(
  transaction: Awaited<ReturnType<typeof db.transaction>>,
  table: "orders" | "order_items",
  entries: Array<[string, string | number | null]>,
) {
  if (entries.length === 0) {
    throw new Error(`هیچ داده‌ای برای ثبت در جدول ${table} پیدا نشد.`);
  }
  const columns = entries.map(([name]) => `"${name.replaceAll('"', '""')}"`);
  const placeholders = entries.map(() => "?");
  return transaction.execute({
    sql: `INSERT INTO "${table}" (${columns.join(", ")})
          VALUES (${placeholders.join(", ")})`,
    args: entries.map(([, value]) => value),
  });
}

function parseItems(value: string): SubmittedItem[] | null {
  if (!value || value.length > 10000) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 50) {
    return null;
  }

  const items = new Map<string, SubmittedItem>();
  for (const candidate of parsed) {
    if (!candidate || typeof candidate !== "object") {
      return null;
    }
    const item = candidate as Record<string, unknown>;
    if (
      typeof item.productId !== "string" ||
      item.productId.length < 1 ||
      item.productId.length > 64 ||
      !Number.isSafeInteger(item.quantity) ||
      Number(item.quantity) < 1 ||
      Number(item.quantity) > 20
    ) {
      return null;
    }
    const existing = items.get(item.productId);
    const quantity = Number(item.quantity) + (existing?.quantity ?? 0);
    if (quantity > 20) {
      return null;
    }
    items.set(item.productId, {
      productId: item.productId,
      quantity,
    });
  }
  return [...items.values()];
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
}
