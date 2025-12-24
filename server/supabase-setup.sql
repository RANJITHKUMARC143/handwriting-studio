-- =====================================================
-- Supabase Database Setup for Text-to-Handwriting
-- =====================================================
-- Run this in your Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste & Run)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Texts table (stores uploaded text content)
CREATE TABLE IF NOT EXISTS texts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 minutes'
);

-- Jobs table (tracks PDF generation jobs)
CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(255) PRIMARY KEY,
    text_id UUID REFERENCES texts(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    settings JSONB NOT NULL,
    pdf_url TEXT,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INDEXES (for better performance)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_texts_expires ON texts(expires_at);
CREATE INDEX IF NOT EXISTS idx_texts_created ON texts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_text_id ON jobs(text_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role full access to texts" ON texts;
DROP POLICY IF EXISTS "Service role full access to jobs" ON jobs;

-- Allow service role to do everything (your backend uses service_role key)
CREATE POLICY "Service role full access to texts"
    ON texts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to jobs"
    ON jobs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- CLEANUP FUNCTION (auto-delete expired texts)
-- =====================================================

CREATE OR REPLACE FUNCTION delete_expired_texts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM texts WHERE expires_at < NOW();
    RAISE NOTICE 'Deleted expired texts';
END;
$$;

-- =====================================================
-- SCHEDULED CLEANUP (runs every hour)
-- =====================================================

-- Note: pg_cron extension must be enabled
-- Go to Database → Extensions → Enable "pg_cron"
-- Then uncomment the line below:

-- SELECT cron.schedule(
--     'delete-expired-texts',
--     '0 * * * *', -- Every hour at minute 0
--     'SELECT delete_expired_texts();'
-- );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('texts', 'jobs');

-- Check if indexes were created
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('texts', 'jobs');

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('texts', 'jobs');

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Database setup complete!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create storage bucket named "pdfs" (Storage → New Bucket)';
    RAISE NOTICE '2. Make the bucket public';
    RAISE NOTICE '3. Restart your server';
END $$;
