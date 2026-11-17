#!/bin/bash
set -e

echo "🔧 در حال اضافه کردن فیلدها به تایپ StorefrontStore در کل پروژه..."
cat << 'INNER_EOF' > fix_types.py
import os

root_dir = "src"
updated_count = 0

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(".ts") or file.endswith(".tsx"):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Check for type definition
            if "type StorefrontStore = {" in content:
                # Check if properties are already inside the type definition
                type_block = content.split("type StorefrontStore = {")[1].split("}")[0]
                if "show_chart" not in type_block:
                    content = content.replace("type StorefrontStore = {", """type StorefrontStore = {
  show_header_widget?: number | boolean | null;
  show_chart?: number | boolean | null;
  chart_type?: string | null;
  chart_color?: string | null;""")
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"✅ تایپ در {file_path} اصلاح شد.")
                    updated_count += 1

            # Check for interface definition
            elif "interface StorefrontStore {" in content:
                type_block = content.split("interface StorefrontStore {")[1].split("}")[0]
                if "show_chart" not in type_block:
                    content = content.replace("interface StorefrontStore {", """interface StorefrontStore {
  show_header_widget?: number | boolean | null;
  show_chart?: number | boolean | null;
  chart_type?: string | null;
  chart_color?: string | null;""")
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"✅ اینترفیس در {file_path} اصلاح شد.")
                    updated_count += 1

if updated_count == 0:
    print("⚠️ فایل تایپ پیدا نشد یا از قبل اصلاح شده بود.")
INNER_EOF

python3 fix_types.py
rm fix_types.py

echo "📦 در حال کامیت و پوش..."
git add .
git commit -m "fix: inject chart properties into StorefrontStore type definition"
git push origin main

echo "🎉 پوش شد! کلودفلر در حال دیپلوی است..."
