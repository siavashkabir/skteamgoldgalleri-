#!/bin/bash
set -e

echo "🧹 1. در حال پاک کردن فایل‌های موقتی که باعث خطا شدن..."
rm -f add_columns.ts
rm -f fix_page.py
rm -f fix_types.py
rm -f fix_middleware.py
rm -f fix_middleware_dynamic.py
rm -f fix_middleware_rewrite.py
rm -f fix_domains.py
rm -f fix_domains_hardcode.py
rm -f fix_duplicate.py
rm -f fix_root_page.py
rm -f fix_actions.py
rm -f fix_page_dynamic.py
rm -f fix_final_dynamic.sh
rm -f fix_everything.sh
rm -f fix_prices.sh
rm -f fix_prices_final.sh
rm -f apply_all_features.sh
rm -f fix_remaining.sh
rm -f fix_actions_restore.sh

echo "✅ فایل‌های اضافی پاک شدند."

echo "📦 2. در حال کامیت و پوش به گیت‌هاب..."
git add -A
git commit -m "chore: remove temporary local scripts that break the build"
git push origin main

echo "🎉 همه چیز تمیز شد! کلودفلر در حال دیپلوی است..."
