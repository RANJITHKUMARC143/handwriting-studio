-- Migration: Storage policies for PDFs bucket
-- Created: 2025-12-24
-- Description: Sets up storage bucket policies for PDF files

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Note: The 'pdfs' bucket must be created manually first via Supabase Dashboard
-- Dashboard → Storage → New Bucket → Name: "pdfs", Public: YES

-- Allow public read access to PDFs (so users can download)
CREATE POLICY "public_read_pdfs"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'pdfs');

-- Allow service role to upload PDFs
CREATE POLICY "service_role_insert_pdfs"
    ON storage.objects
    FOR INSERT
    TO service_role
    WITH CHECK (bucket_id = 'pdfs');

-- Allow service role to update PDFs
CREATE POLICY "service_role_update_pdfs"
    ON storage.objects
    FOR UPDATE
    TO service_role
    USING (bucket_id = 'pdfs');

-- Allow service role to delete PDFs
CREATE POLICY "service_role_delete_pdfs"
    ON storage.objects
    FOR DELETE
    TO service_role
    USING (bucket_id = 'pdfs');

-- =====================================================
-- BUCKET CONFIGURATION
-- =====================================================

-- Note: These settings should be configured in the Supabase Dashboard:
-- 
-- Bucket Name: pdfs
-- Public: YES (important for downloads)
-- File Size Limit: 10 MB
-- Allowed MIME Types: application/pdf (optional)
--
-- To create the bucket:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: pdfs
-- 4. Public: ✅ YES
-- 5. Click "Create bucket"
