import { createClient } from "@libsql/client";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const tenantId = "team-gold-system";
const categories = [
  { id: "team-gold-men", name: "مردانه" },
  { id: "team-gold-women", name: "زنانه" },
];
const products = [
  {
    id: "team-gold-men-ring",
    name: "انگشتر طلا مردانه",
    price: 42500000,
    weight: 3.2,
    description: "انگشتر طلای مردانه با طراحی ساده و کلاسیک.",
    imageUrl: "https://placehold.co/400x400?text=Mens+Gold+Ring",
    categoryId: "team-gold-men",
  },
  {
    id: "team-gold-men-bracelet",
    name: "دستبند طلا مردانه",
    price: 38500000,
    weight: 2.9,
    description: "دستبند طلای مردانه مناسب استفاده روزمره.",
    imageUrl: "https://placehold.co/400x400?text=Mens+Gold+Bracelet",
    categoryId: "team-gold-men",
  },
  {
    id: "team-gold-men-chain",
    name: "زنجیر طلا مردانه",
    price: 51200000,
    weight: 3.8,
    description: "زنجیر طلای مردانه با بافت ظریف و ماندگار.",
    imageUrl: "https://placehold.co/400x400?text=Mens+Gold+Chain",
    categoryId: "team-gold-men",
  },
  {
    id: "team-gold-men-pendant",
    name: "گردنبند طلا مردانه",
    price: 33700000,
    weight: 2.5,
    description: "گردنبند طلای مردانه با پلاک مینیمال.",
    imageUrl: "https://placehold.co/400x400?text=Mens+Gold+Pendant",
    categoryId: "team-gold-men",
  },
  {
    id: "team-gold-women-ring",
    name: "انگشتر طلا زنانه",
    price: 29800000,
    weight: 2.1,
    description: "انگشتر طلای زنانه با ظرافتی ساده و چشم‌نواز.",
    imageUrl: "https://placehold.co/400x400?text=Womens+Gold+Ring",
    categoryId: "team-gold-women",
  },
  {
    id: "team-gold-women-bracelet",
    name: "دستبند طلا زنانه",
    price: 31500000,
    weight: 2.3,
    description: "دستبند طلای زنانه سبک برای هر مناسبت.",
    imageUrl: "https://placehold.co/400x400?text=Womens+Gold+Bracelet",
    categoryId: "team-gold-women",
  },
  {
    id: "team-gold-women-chain",
    name: "زنجیر طلا زنانه",
    price: 26400000,
    weight: 1.9,
    description: "زنجیر طلای زنانه با زنجیره‌ای لطیف و براق.",
    imageUrl: "https://placehold.co/400x400?text=Womens+Gold+Chain",
    categoryId: "team-gold-women",
  },
  {
    id: "team-gold-women-earrings",
    name: "گوشواره طلا زنانه",
    price: 22100000,
    weight: 1.6,
    description: "گوشواره طلای زنانه با طراحی ظریف و سبک.",
    imageUrl: "https://placehold.co/400x400?text=Womens+Gold+Earrings",
    categoryId: "team-gold-women",
  },
];

const db = createClient({
  url: requiredEnv("TURSO_DATABASE_URL"),
  authToken: requiredEnv("TURSO_AUTH_TOKEN"),
});

try {
  const tenant = await db.execute({
    sql: "SELECT id, name FROM tenants WHERE id = ?",
    args: [tenantId],
  });
  if (tenant.rows.length !== 1) {
    throw new Error(`Default tenant "${tenantId}" was not found in Turso.`);
  }

  const tableResult = await db.execute({
    sql: "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'shops'",
  });
  let shopId;
  if (tableResult.rows.length) {
    const shopResult = await db.execute({
      sql: `SELECT id FROM shops
            WHERE slug = 'skteam'
              AND (name = ? OR (SELECT COUNT(*) FROM tenants) = 1)
            ORDER BY id LIMIT 1`,
      args: [tenant.rows[0].name],
    });
    shopId = shopResult.rows[0]?.id;
  }

  const categoryStatements = categories.map((category) => ({
    sql: `INSERT INTO categories (id, tenant_id, name)
          VALUES (?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET name = excluded.name
          WHERE categories.tenant_id = excluded.tenant_id`,
    args: [category.id, tenantId, category.name],
  }));
  const productColumnsResult = await db.execute("PRAGMA table_info(products)");
  const productColumns = new Map(
    productColumnsResult.rows.map((row) => [String(row.name), row]),
  );
  for (const requiredColumn of ["tenant_id", "name", "price", "weight"]) {
    if (!productColumns.has(requiredColumn)) {
      throw new Error(
        `The products table is missing "${requiredColumn}". Run npm run db:init first.`,
      );
    }
  }
  const shopIdColumn = productColumns.get("shop_id");
  if (shopIdColumn?.notnull && shopIdColumn.dflt_value === null && shopId == null) {
    throw new Error('The products table requires a shop_id, but shop "skteam" was not found.');
  }
  const hasTextId =
    productColumns.get("id")?.type === "TEXT" &&
    Number(productColumns.get("id")?.pk) === 1;
  const productStatements = products.flatMap((product) => {
    const values = {
      ...(hasTextId ? { id: product.id } : {}),
      ...(shopIdColumn ? { shop_id: shopId } : {}),
      tenant_id: tenantId,
      name: product.name,
      ...(productColumns.has("title") ? { title: product.name } : {}),
      price: product.price,
      weight: product.weight,
      description: product.description,
      image_url: product.imageUrl,
      ...(productColumns.has("category") ? {
        category: categories.find((category) => category.id === product.categoryId).name,
      } : {}),
      category_id: product.categoryId,
      is_visible: 1,
      ...(productColumns.has("is_active") ? { is_active: 1 } : {}),
      condition: "new",
      labor_percentage: 0,
      ...(productColumns.has("labor_fee") ? { labor_fee: 0 } : {}),
      ...(productColumns.has("karat") ? { karat: 18 } : {}),
    };
    const entries = Object.entries(values).filter(([column]) =>
      productColumns.has(column),
    );
    const identity = hasTextId
      ? { sql: "id = ? AND tenant_id = ?", args: [product.id, tenantId] }
      : {
          sql: `tenant_id = ? AND name = ?${shopIdColumn ? " AND shop_id = ?" : ""}`,
          args: [tenantId, product.name, ...(shopIdColumn ? [shopId] : [])],
        };
    const insertIdentity = hasTextId
      ? { sql: "id = ?", args: [product.id] }
      : {
          sql: `tenant_id = ? AND name = ?${shopIdColumn ? " AND shop_id = ?" : ""}`,
          args: [tenantId, product.name, ...(shopIdColumn ? [shopId] : [])],
        };
    const updates = entries.filter(([column]) => column !== "id");
    const insertSql = `INSERT INTO products (${entries.map(([column]) => column).join(", ")})
                       SELECT ${entries.map(() => "?").join(", ")}
                       WHERE NOT EXISTS (
                         SELECT 1 FROM products WHERE ${insertIdentity.sql}
                       )`;
    return [
      {
        sql: `UPDATE products SET ${updates.map(([column]) => `${column} = ?`).join(", ")}
              WHERE ${identity.sql}`,
        args: [...updates.map(([, value]) => value), ...identity.args],
      },
      {
        sql: insertSql,
        args: [...entries.map(([, value]) => value), ...insertIdentity.args],
      },
    ];
  });
  await db.batch([...categoryStatements, ...productStatements], "write");

  const productResult = await db.execute({
    sql: `SELECT name FROM products
          WHERE tenant_id = ? AND name IN (${products.map(() => "?").join(", ")})`,
    args: [tenantId, ...products.map((product) => product.name)],
  });
  if (productResult.rows.length !== products.length) {
    throw new Error(
      `Seed verification failed: expected ${products.length} products, found ${productResult.rows.length}.`,
    );
  }

  console.log(
    `Seeded and verified ${products.length} products in ${categories.length} categories for ${tenantId}.`,
  );
} finally {
  await db.close();
}
