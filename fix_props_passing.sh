#!/bin/bash
set -e

echo "🚀 1. در حال اصلاح storefront-header.tsx..."
cat << 'INNER_EOF' > fix_header.py
file_path = "src/app/(storefront)/storefront-header.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_line = "<LivePriceWidget businessType={store.businessType} />"
new_line = "<LivePriceWidget businessType={store.businessType} showWidget={store.show_header_widget !== 0 && store.show_header_widget !== false} />"

if old_line in content:
    content = content.replace(old_line, new_line)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ storefront-header.tsx اصلاح شد.")
else:
    print("⚠️ خط مورد نظر در هدر پیدا نشد.")
INNER_EOF
python3 fix_header.py

echo "🚀 2. در حال اصلاح page.tsx (فروشگاه)..."
cat << 'INNER_EOF' > fix_page.py
file_path = "src/app/(storefront)/[tenant_slug]/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_line = "<PriceTrends />"
new_line = '<PriceTrends showChart={store.show_chart !== 0 && store.show_chart !== false} chartType={store.chart_type || "line"} chartColor={store.chart_color || "#d4af37"} />'

if old_line in content:
    content = content.replace(old_line, new_line)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ page.tsx اصلاح شد.")
else:
    print("⚠️ خط مورد نظر در page.tsx پیدا نشد.")
INNER_EOF
python3 fix_page.py

echo "🧹 3. پاک کردن اسکریپت‌های موقت..."
rm fix_header.py fix_page.py

echo "📦 4. در حال کامیت و پوش به گیت‌هاب..."
git add src/app/\(storefront\)/storefront-header.tsx src/app/\(storefront\)/\[tenant_slug\]/page.tsx
git commit -m "fix: pass display settings (showWidget, showChart, colors) from DB to components"
git push origin main

echo "🎉 تغییرات پوش شد! کلودفلر در حال دیپلوی است..."
