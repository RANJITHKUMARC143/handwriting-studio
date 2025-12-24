import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceKey);

// Create Supabase client with service role key (bypasses RLS)
export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection(): Promise<boolean> {
    if (!supabase) {
        console.log('ℹ️  Supabase not configured, using local storage');
        return false;
    }

    try {
        const { data, error } = await supabase.from('texts').select('count');
        if (error) throw error;
        console.log('✅ Supabase connected successfully');
        return true;
    } catch (error: any) {
        console.error('❌ Supabase connection failed:', error.message);
        return false;
    }
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadToSupabase(
    bucket: string,
    path: string,
    file: Buffer,
    contentType: string
): Promise<string> {
    if (!supabase) {
        throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            contentType,
            upsert: true
        });

    if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

    return publicUrl;
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFromSupabase(
    bucket: string,
    path: string
): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

    if (error) {
        console.error(`Failed to delete from Supabase: ${error.message}`);
    }
}
