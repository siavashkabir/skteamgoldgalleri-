"use server";

import { db } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/storefront-types";

export type RegistrationState = {
  error?: string;
  success?: string;
};

export async function registerCustomer(
  _previousState: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const firstName = readText(formData, "first_name");
  const lastName = readText(formData, "last_name");
  const nationalId = normalizeDigits(readText(formData, "national_id"));
  const mobile = normalizeDigits(readText(formData, "mobile"));
  const email = readText(formData, "email").toLowerCase();
  const passwordEntry = formData.get("password");
  const password = typeof passwordEntry === "string" ? passwordEntry : "";
  const address = readText(formData, "address");

  if (!firstName || firstName.length > 80 || !lastName || lastName.length > 80) {
    return { error: "نام و نام خانوادگی را به‌درستی وارد کنید." };
  }
  if (!/^[0-9]{10}$/.test(nationalId)) {
    return { error: "کد ملی باید دقیقاً ۱۰ رقم باشد." };
  }
  if (!/^[0-9+()\-\s]{8,25}$/.test(mobile)) {
    return { error: "شماره موبایل را به‌درستی وارد کنید." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { error: "نشانی ایمیل معتبر نیست." };
  }
  if (password.length < 8 || password.length > 128) {
    return { error: "رمز عبور باید حداقل ۸ نویسه باشد." };
  }
  if (!address || address.length > 1000) {
    return { error: "نشانی را وارد کنید (حداکثر ۱۰۰۰ نویسه)." };
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  });
  if (error) {
    if (error.code === "email_exists" || error.message.toLowerCase().includes("already")) {
      return { error: "برای این ایمیل قبلاً حساب کاربری ساخته شده است." };
    }
    return { error: `ساخت حساب کاربری انجام نشد: ${error.message}` };
  }
  if (!data.user) {
    throw new Error("Supabase کاربر تازه‌ساخته‌شده را برنگرداند.");
  }

  try {
    await db.execute({
      sql: `INSERT INTO profiles
              (id, tenant_id, role, full_name, first_name, last_name,
               national_id, mobile, email, address)
            VALUES (?, ?, 'customer', ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        data.user.id,
        DEFAULT_TENANT_ID,
        `${firstName} ${lastName}`,
        firstName,
        lastName,
        nationalId,
        mobile,
        email,
        address,
      ],
    });
  } catch (databaseError) {
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      data.user.id,
    );
    if (deleteError) {
      throw new AggregateError(
        [databaseError, deleteError],
        "ذخیره پروفایل ناموفق بود و پاک‌سازی حساب Supabase نیز انجام نشد.",
      );
    }
    throw databaseError;
  }

  return {
    success: "حساب کاربری شما ساخته شد. اکنون می‌توانید وارد شوید.",
  };
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
