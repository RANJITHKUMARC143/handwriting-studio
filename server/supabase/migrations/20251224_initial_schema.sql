-- Migration: Initial schema for text-to-handwriting application
-- Created: 2025-12-24
-- Description: Creates tables for texts and jobs, with indexes and RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Texts table (stores uploaded text content)
CREATE TABLE IF NOT EXISTS public.texts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 minutes'
);

-- Jobs table (tracks PDF generation jobs)
CREATE TABLE IF NOT EXISTS public.jobs (
    id VARCHAR(255) PRIMARY KEY,
    text_id UUID REFERENCES public.texts(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('waiting', 'active', 'completed', 'failed')),
    settings JSONB NOT NULL,
    pdf_url TEXT,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_texts_expires ON public.texts(expires_at);
CREATE INDEX IF NOT EXISTS idx_texts_created ON public.texts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_text_id ON public.jobs(text_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE public.texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Service role has full access (backend uses service_role key)
CREATE POLICY "service_role_all_texts"
    ON public.texts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_all_jobs"
    ON public.jobs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to delete expired texts
CREATE OR REPLACE FUNCTION public.delete_expired_texts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.texts 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Function to delete old completed jobs
CREATE OR REPLACE FUNCTION public.delete_old_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.jobs 
    WHERE (status = 'completed' OR status = 'failed')
    AND created_at < NOW() - INTERVAL '30 minutes';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- =====================================================
-- COMMENTS (for documentation)
-- =====================================================

COMMENT ON TABLE public.texts IS 'Stores uploaded text content with 30-minute expiration';
COMMENT ON TABLE public.jobs IS 'Tracks PDF generation job status and progress';
COMMENT ON COLUMN public.texts.expires_at IS 'Automatic expiration timestamp (30 minutes after creation)';
COMMENT ON COLUMN public.jobs.pdf_url IS 'Supabase Storage URL for generated PDF';
COMMENT ON FUNCTION public.delete_expired_texts() IS 'Removes texts older than their expiration time';
COMMENT ON FUNCTION public.delete_old_jobs() IS 'Removes completed/failed jobs older than 30 minutes';
