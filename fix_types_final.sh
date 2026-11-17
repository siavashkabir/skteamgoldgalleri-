#!/bin/bash
set -e

echo "🔍 1. در حال پیدا کردن فایل تایپ فروشگاه..."
# پیدا کردن فایلی که تایپ StorefrontStore توش تعریف شده
TYPES_FILE=$(grep -rl "StorefrontStore" src/lib/ | head -n 1)

if [ -z "$TYPES_FILE" ]; then
  echo "❌ فایل تایپ پیدا نشد."
  exit 1
fi

echo "✅ فایل پیدا شد: $TYPES_FILE"

echo "🚀 2. در حال اضافه کردن فیلدهای جدید به تایپ..."

# اضافه کردن فیلدها بعد از تعریف StorefrontStore
if grep -q "show_chart" "$TYPES_FILE"; then
  echo "⚠️ فیلدها از قبل وجود دارند."
else
  # با استفاده از sed بعد از خطی که StorefrontStore = { یا interface StorefrontStore { داره، فیلدها رو اضافه می‌کنیم
  sed -i '/StorefrontStore\s*=\s*{/a \  show_header_widget?: number | boolean | null;\n  show_chart?: number | boolean | null;\n  chart_type?: string | null;\n  chart_color?: string | null;' "$TYPES_FILE"
  echo "✅ فیلدها به تایپ اضافه شدند."
fi

echo "📦 3. در حال کامیت و پوش به گیت‌هاب..."
git add "$TYPES_FILE"
git commit -m "fix: add missing chart and header settings to StorefrontStore type"
git push origin main

echo "🎉 تغییرات پوش شد! کلودفلر در حال دیپلوی است..."
