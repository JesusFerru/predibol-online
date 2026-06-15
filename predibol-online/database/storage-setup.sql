-- =====================================================
-- SUPABASE STORAGE SETUP — PAYMENT RECEIPTS
-- =====================================================
--
-- Run this after creating the "payment-receipts" bucket
-- in the Supabase Dashboard (Storage → New Bucket).
--
-- Bucket configuration:
--   Name: payment-receipts
--   Public bucket: YES (receipts need public URLs for admin review)
--   File size limit: 5 MB
--   Allowed MIME types: image/jpeg, image/png, image/webp
--
-- File path convention (enforced by app, not storage):
--   {userId}/{matchId}/{timestamp}.{ext}
--   Example: a1b2c3d4.../42/1718400000000.png
--
-- =====================================================
-- STORAGE RLS POLICIES
-- =====================================================

-- 1. Allow authenticated users to upload receipts to their own folder
CREATE POLICY "Users can upload own receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'payment-receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Allow authenticated users to read any receipt (for admin review)
CREATE POLICY "Anyone can read receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'payment-receipts');

-- 3. Allow authenticated users to delete their own receipts
CREATE POLICY "Users can delete own receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'payment-receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow authenticated users to update their own receipts
--    (needed for receipt replacement flow)
CREATE POLICY "Users can update own receipts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'payment-receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
