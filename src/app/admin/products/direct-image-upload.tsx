"use client";

import Image from "next/image";
import { useState } from "react";
import { uploadImageDirect } from "@/lib/upload-client";

/**
 * کامپوننت آپلود مستقیم تصویر به Supabase
 * فایل‌ها مستقیم از مرورگر به Supabase آپلود می‌شوند — بدون عبور از Worker
 */
export function DirectImageUpload({
  uploadedImages,
  setUploadedImages,
  maxImages = 5,
  bucket = "products",
  label = "تصاویر محصول",
}: {
  uploadedImages: string[];
  setUploadedImages: (urls: string[]) => void;
  maxImages?: number;
  bucket?: string;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  async function handleFileSelect(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);

    const remaining = maxImages - uploadedImages.length;
    if (remaining <= 0) {
      setError("حداکثر تعداد تصاویر reached شده است");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);

    setUploading(true);
    setProgress({ done: 0, total: filesToUpload.length });

    const newUrls: string[] = [];
    for (let i = 0; i < filesToUpload.length; i++) {
      const result = await uploadImageDirect(filesToUpload[i], bucket);
      if (result.error) {
        setError(result.error);
        break;
      }
      if (result.url) {
        newUrls.push(result.url);
      }
      setProgress({ done: i + 1, total: filesToUpload.length });
    }

    if (newUrls.length) {
      setUploadedImages([...uploadedImages, ...newUrls]);
    }
    setUploading(false);
    setProgress({ done: 0, total: 0 });
    event.target.value = "";
  }

  function removeImage(index: number) {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm text-[#c5c1b6]">{label}</label>
      <input
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="mt-2 h-auto w-full rounded-xl border border-white/[0.09] bg-[#10100f] px-3 py-2 text-sm text-[#f5f2e9] outline-none focus:border-[#d6ad56]/60"
        disabled={uploading || uploadedImages.length >= maxImages}
        multiple
        onChange={handleFileSelect}
        type="file"
      />
      {uploading && (
        <p className="text-xs text-[#d6ad56]">
          در حال آپلود... ({progress.done}/{progress.total})
        </p>
      )}
      {error && <p className="text-xs text-red-300">{error}</p>}
      {uploadedImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uploadedImages.map((url, index) => (
            <div key={index} className="relative">
              <Image
                alt={`تصویر ${index + 1}`}
                className="h-16 w-16 rounded-lg object-cover"
                height={64}
                src={url}
                unoptimized
                width={64}
              />
              <button
                className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-xs text-white"
                onClick={() => removeImage(index)}
                type="button"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
