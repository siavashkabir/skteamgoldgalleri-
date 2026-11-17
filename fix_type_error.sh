#!/bin/bash
set -e

echo "🔧 در حال اصلاح خطای TypeScript در storefront-data.ts..."
cat << 'INNER_EOF' > fix_sf.py
import re

file_path = "src/lib/storefront-data.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. پاک کردن خطوط اشتباهی که توی آبجکت قرار گرفته بودند
content = re.sub(r'\s*show_header_widget\?:\s*number\s*\|\s*boolean\s*\|\s*null;', '', content)
content = re.sub(r'\s*show_chart\?:\s*number\s*\|\s*boolean\s*\|\s*null;', '', content)
content = re.sub(r'\s*chart_type\?:\s*string\s*\|\s*null;', '', content)
content = re.sub(r'\s*chart_color\?:\s*string\s*\|\s*null;', '', content)

# 2. اضافه کردن مقادیر پیش‌فرض به fallbackDefaultStore
content = content.replace("const fallbackDefaultStore: StorefrontStore = {", """const fallbackDefaultStore: StorefrontStore = {
  show_header_widget: 1,
  show_chart: 1,
  chart_type: "line",
  chart_color: "#d4af37",""")

# 3. اضافه کردن فیلدها به تایپ اصلی
if "type StorefrontStore = {" in content:
    content = content.replace("type StorefrontStore = {", """type StorefrontStore = {
  show_header_widget?: number | boolean | null;
  show_chart?: number | boolean | null;
  chart_type?: string | null;
  chart_color?: string | null;""")
elif "interface StorefrontStore {" in content:
    content = content.replace("interface StorefrontStore {", """interface StorefrontStore {
  show_header_widget?: number | boolean | null;
  show_chart?: number | boolean | null;
  chart_type?: string | null;
  chart_color?: string | null;""")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ فایل storefront-data.ts اصلاح شد.")
INNER_EOF
python3 fix_sf.py
rm fix_sf.py

echo "📦 در حال کامیت و پوش..."
git add src/lib/storefront-data.ts
git commit -m "fix: resolve invalid object member declaration in storefront-data"
git push origin main

echo "🎉 پوش شد! کلودفلر در حال دیپلوی است..."
