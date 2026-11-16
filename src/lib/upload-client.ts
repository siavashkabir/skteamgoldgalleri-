"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export type UploadResult = { url: string; error?: string };

/**
 * آپلود مستقیم فایل از مرورگر به Supabase Storage
 * این تابع فایل را از طریق Worker عبور نمی‌دهد — مستقیم به Supabase می‌رود
 */
export async function uploadImageDirect(
  file: File,
  bucket: string = "products",
): Promise<UploadResult> {
  try {
    const extension = ALLOWED_TYPES[file.type];
    if (!extension) {
      return { url: "", error: "فرمت تصویر پشتیبانی نمی‌شود (JPEG، PNG، WebP، AVIF)" };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { url: "", error: "حجم هر تصویر نباید بیش از ۵ مگابایت باشد" };
    }

    const supabase = createSupabaseBrowserClient();
    const path = `${crypto.randomUUID()}.${extension}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return { url: "", error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl };
  } catch {
    return { url: "", error: "خطای ارتباط با سرور" };
  }
}

/**
 * آپلود چندین تصویر به‌صورت همزمان
 */
export async function uploadMultipleImages(
  files: File[],
  bucket: string = "products",
  onProgress?: (completed: number, total: number) => void,
): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadImageDirect(files[i], bucket);
    if (result.error) {
      errors.push(result.error);
    } else if (result.url) {
      urls.push(result.url);
    }
    onProgress?.(i + 1, files.length);
  }

  return { urls, errors };
}
