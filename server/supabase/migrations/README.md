# Supabase Migrations

This directory contains database migrations for the text-to-handwriting application.

## How to Apply Migrations

### Option 1: Manual (Recommended for first-time setup)

1. **Go to Supabase Dashboard**
   - URL: https://rkdtvlvxrggmtcxkbtif.supabase.co
   - Navigate to: **SQL Editor**

2. **Run Initial Schema Migration**
   - Click **New Query**
   - Copy contents of `20251224_initial_schema.sql`
   - Paste and click **Run** (or Ctrl/Cmd + Enter)
   - Should see: "Success. No rows returned"

3. **Create Storage Bucket**
   - Navigate to: **Storage**
   - Click **New bucket**
   - Name: `pdfs`
   - Public: ✅ **YES** (important!)
   - Click **Create bucket**

4. **Run Storage Policies Migration**
   - Go back to **SQL Editor**
   - Click **New Query**
   - Copy contents of `20251224_storage_policies.sql`
   - Paste and click **Run**

### Option 2: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref rkdtvlvxrggmtcxkbtif

# Push migrations
supabase db push
```

## Migration Files

### `20251224_initial_schema.sql`
- Creates `texts` and `jobs` tables
- Sets up indexes for performance
- Enables Row Level Security (RLS)
- Creates cleanup functions

### `20251224_storage_policies.sql`
- Sets up storage bucket policies
- Allows public read access to PDFs
- Allows service role to manage files

## Verification

After running migrations, verify in Supabase Dashboard:

### Check Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('texts', 'jobs');
```

Expected: 2 rows (texts, jobs)

### Check Indexes
```sql
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('texts', 'jobs');
```

Expected: 5+ indexes

### Check RLS
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('texts', 'jobs');
```

Expected: Both tables should have `rowsecurity = true`

### Check Storage Bucket
- Go to **Storage** in dashboard
- Should see `pdfs` bucket
- Click on it → Settings → Should show "Public: Yes"

## Rollback (if needed)

To rollback migrations:

```sql
-- Drop tables
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.texts CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.delete_expired_texts();
DROP FUNCTION IF EXISTS public.delete_old_jobs();
```

## Next Steps

After migrations are applied:

1. ✅ Verify tables exist
2. ✅ Verify storage bucket exists
3. ✅ Update server `.env` with Supabase credentials
4. ✅ Restart server
5. ✅ Test upload and PDF generation

## Troubleshooting

### "relation already exists"
- Migrations have already been run
- Safe to ignore or drop tables and re-run

### "permission denied"
- Make sure you're using the correct Supabase project
- Check that service_role key is correct in `.env`

### Storage policies not working
- Make sure bucket is created first
- Bucket must be named exactly `pdfs`
- Bucket must be public

## Support

For issues, check:
- Supabase Dashboard → Logs
- Server console output
- `.env` file has correct credentials
