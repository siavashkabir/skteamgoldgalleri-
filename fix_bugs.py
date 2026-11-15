import re, sys
from pathlib import Path

def load(path):
    return Path(path).read_text(encoding="utf-8")

def once(text, path, old, new):
    count = text.count(old)
    if count != 1:
        sys.exit(f"ABORT (nothing changed): {path}: {count} matches for {old[:70]!r}")
    return text.replace(old, new)

files = {}

# 1) Header: label for business type + first letter of the store name
path = "src/app/(storefront)/storefront-header.tsx"
t = load(path)
t = once(t, path, 'import { categoryFilterValue } from "@/lib/category-filters";',
'''import { categoryFilterValue } from "@/lib/category-filters";
import { businessTypeLabel } from "@/lib/tenant-features";''')
t = once(t, path, "{store.businessType ||", "{businessTypeLabel(store.businessType) ||")
t, n = re.subn(r'\n[ \t]*ت[ \t]*\n',
               lambda m: '\n              {Array.from(store.name.trim())[0] ?? "ت"}\n', t)
if n != 1:
    sys.exit(f"ABORT (nothing changed): {path}: logo letter matches = {n}")
files[path] = t

# 2) Product action: business-kind aware validation + auto-parts fields
path = "src/app/admin/products/actions.ts"
t = load(path)
t = once(t, path, 'import { getSupabaseAdminClient } from "@/lib/supabase";',
'''import { getSupabaseAdminClient } from "@/lib/supabase";
import { AUTO_PART_SPEC_KEYS, resolveBusinessKind } from "@/lib/tenant-features";''')
t = once(t, path, 'const { tenantId, tenantName } = await requireTenantModule("ecommerce");',
'''const { tenantId, tenantName, businessType, enabledModules } =
    await requireTenantModule("ecommerce");
  const businessKind = resolveBusinessKind(businessType, enabledModules);''')
t = once(t, path, 'if (!Number.isFinite(weight) || weight <= 0) {',
         'if (businessKind === "gold" && (!Number.isFinite(weight) || weight <= 0)) {')
t = once(t, path, 'const customFields: Record<string, string> = {};',
'''if (businessKind === "auto_parts") {
    for (const [field, label] of Object.entries(AUTO_PART_SPEC_KEYS)) {
      const value = readText(formData, field);
      if (value.length > 300) {
        return { error: `مقدار «${label}» نباید بیشتر از ۳۰۰ نویسه باشد.` };
      }
      if (value) {
        specifications[label] = value;
      }
    }
  }
  const customFields: Record<string, string> = {};''')
files[path] = t

# 3) createTenant: save the custom font too
path = "src/app/master-admin/actions.ts"
t = load(path)
t = once(t, path, 'const kycData = readInitialKyc(formData);',
'''const fontResult = await uploadTenantFont(formData, id);
  if (fontResult.error) return { error: fontResult.error };
  const kycData = readInitialKyc(formData);''')
t = once(t, path, 'enabled_modules, kyc_data, logo_url, status, expiry_date, theme_settings)',
         'enabled_modules, kyc_data, logo_url, custom_font_url, status, expiry_date, theme_settings)')
t = once(t, path, 'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
         'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
t = once(t, path, 'logoResult.url,', '''logoResult.url,
      fontResult.url,''')
files[path] = t

# 4) Add-tenant dialog: business type select + font upload field
path = "src/app/master-admin/add-tenant-dialog.tsx"
t = load(path)
t = once(t, path,
'<input className={inputClass} maxLength={120} name="business_type" placeholder="فروشگاه، کلینیک، گردشگری..." />',
'''<select className={inputClass} defaultValue="general" name="business_type">
                    <option value="general">فروشگاه عمومی / سایر</option>
                    <option value="gold">طلا و جواهر</option>
                    <option value="auto_parts">قطعات خودرو</option>
                    <option value="clinic">کلینیک و درمان</option>
                    <option value="tourism">گردشگری</option>
                  </select>''')
t = once(t, path, '<ThemeSettingsFields />',
'''<label className="block text-sm text-[#c5c1b6]">
                فونت اختصاصی ویترین (TTF یا WOFF، حداکثر ۵ مگابایت)
                <input accept=".ttf,.woff,font/ttf,font/woff" className={`${inputClass} h-auto py-2`} name="custom_font_file" type="file" />
              </label>
              <ThemeSettingsFields />''')
files[path] = t

for p, content in files.items():
    Path(p).write_text(content, encoding="utf-8")
print("OK, patched:", *files, sep="\n  ")
PY
