"use client";

import { createClient } from "@/lib/supabase/client";

const RECEIPTS_BUCKET = "receipts";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface UploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Validates and uploads a receipt image to Supabase Storage.
 *
 * Path format: {userId}/{matchId}/{timestamp}.{ext}
 *
 * Validation:
 *   - Allowed types: JPG, PNG, WEBP
 *   - Maximum size: 5 MB
 */
export async function uploadReceipt(
  file: File,
  userId: string,
  matchId: string,
): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: null, error: "Only JPG, PNG, and WEBP images are allowed." };
  }

  // Validate file size
  if (file.size > MAX_SIZE_BYTES) {
    return { url: null, error: "File must be under 5 MB." };
  }

  // Build storage path
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const timestamp = Date.now();
  const path = `${userId}/${matchId}/${timestamp}.${ext}`;

  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Receipt upload failed:", error);
    return { url: null, error: error.message };
  }

  // Get the public URL for the uploaded file
  const { data: urlData } = supabase.storage
    .from(RECEIPTS_BUCKET)
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, error: null };
}

/**
 * Deletes a receipt file from Supabase Storage.
 *
 * Extracts the path from the full public URL.
 */
export async function deleteReceipt(publicUrl: string): Promise<void> {
  const supabase = createClient();

  // Extract path from public URL
  // Format: https://<project>.supabase.co/storage/v1/object/public/receipts/<path>
  const bucketPrefix = `/storage/v1/object/public/${RECEIPTS_BUCKET}/`;
  const idx = publicUrl.indexOf(bucketPrefix);

  if (idx === -1) {
    console.error("Could not parse receipt URL:", publicUrl);
    return;
  }

  const path = publicUrl.slice(idx + bucketPrefix.length);

  const { error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .remove([path]);

  if (error) {
    console.error("Failed to delete receipt:", error);
  }
}
