import { pool } from '../db';
import { supabase, isSupabaseConfigured, uploadToSupabase, deleteFromSupabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage fallback (for local development without PostgreSQL)
const inMemoryTexts = new Map<string, { content: string; createdAt: Date }>();
const inMemoryJobs = new Map<string, any>();

/**
 * Save text content to Supabase, PostgreSQL, or in-memory storage
 */
export async function saveText(content: string): Promise<string> {
    // Priority: Supabase > PostgreSQL > In-memory
    if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
            .from('texts')
            .insert({ content })
            .select('id')
            .single();

        if (error) throw new Error(`Supabase error: ${error.message}`);
        console.log(`💾 Saved text to Supabase: ${data.id}`);
        return data.id;
    }

    // Fallback to PostgreSQL
    if (pool) {
        try {
            const result = await pool.query(
                'INSERT INTO texts (content) VALUES ($1) RETURNING id',
                [content]
            );
            const textId = result.rows[0].id;
            console.log(`💾 Saved text to PostgreSQL: ${textId}`);
            return textId;
        } catch (error) {
            console.error('PostgreSQL save error:', error);
            throw new Error('Failed to save text to database');
        }
    }

    // Fallback to in-memory
    const textId = uuidv4();
    inMemoryTexts.set(textId, { content, createdAt: new Date() });
    console.log(`💾 Saved text to memory: ${textId}`);
    return textId;
}

/**
 * Retrieve text content from Supabase, PostgreSQL, or in-memory storage
 */
export async function getText(id: string): Promise<string | null> {
    // Priority: Supabase > PostgreSQL > In-memory
    if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
            .from('texts')
            .select('content')
            .eq('id', id)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error) {
            console.warn(`⚠️  Text not found in Supabase: ${id}`);
            return null;
        }

        return data.content;
    }

    // Fallback to PostgreSQL
    if (pool) {
        try {
            const result = await pool.query(
                'SELECT content FROM texts WHERE id = $1 AND expires_at > NOW()',
                [id]
            );

            if (result.rows.length === 0) {
                console.warn(`⚠️  Text not found in PostgreSQL: ${id}`);
                return null;
            }

            return result.rows[0].content;
        } catch (error) {
            console.error('PostgreSQL get error:', error);
            throw new Error('Failed to retrieve text from database');
        }
    }

    // Fallback to in-memory
    const stored = inMemoryTexts.get(id);
    if (!stored) {
        console.warn(`⚠️  Text not found in memory: ${id}`);
        return null;
    }

    // Check if expired (30 minutes)
    const age = Date.now() - stored.createdAt.getTime();
    if (age > 30 * 60 * 1000) {
        inMemoryTexts.delete(id);
        console.warn(`⚠️  Text expired: ${id}`);
        return null;
    }

    return stored.content;
}

/**
 * Delete text from storage
 */
export async function deleteText(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('texts').delete().eq('id', id);
        if (error) console.error('Supabase delete error:', error);
        else console.log(`🗑️  Deleted text from Supabase: ${id}`);
        return;
    }

    if (pool) {
        try {
            await pool.query('DELETE FROM texts WHERE id = $1', [id]);
            console.log(`🗑️  Deleted text from PostgreSQL: ${id}`);
        } catch (error) {
            console.error('PostgreSQL delete error:', error);
        }
        return;
    }

    inMemoryTexts.delete(id);
    console.log(`🗑️  Deleted text from memory: ${id}`);
}

/**
 * Save job information
 */
export async function saveJob(
    jobId: string,
    textId: string,
    settings: any
): Promise<void> {
    if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('jobs').insert({
            id: jobId,
            text_id: textId,
            status: 'waiting',
            settings,
            progress: 0
        });

        if (error) {
            console.error('Supabase job save error:', error);
        } else {
            console.log(`📝 Created job in Supabase: ${jobId}`);
        }
        return;
    }

    if (pool) {
        try {
            await pool.query(
                `INSERT INTO jobs (id, text_id, status, settings) 
                 VALUES ($1, $2, $3, $4)`,
                [jobId, textId, 'waiting', JSON.stringify(settings)]
            );
            console.log(`📝 Created job in PostgreSQL: ${jobId}`);
        } catch (error) {
            console.error('PostgreSQL job save error:', error);
        }
        return;
    }

    inMemoryJobs.set(jobId, {
        id: jobId,
        text_id: textId,
        status: 'waiting',
        settings,
        progress: 0,
        created_at: new Date()
    });
    console.log(`📝 Created job in memory: ${jobId}`);
}

/**
 * Update job status
 */
export async function updateJobStatus(
    jobId: string,
    status: string,
    progress?: number,
    pdfUrl?: string
): Promise<void> {
    if (isSupabaseConfigured && supabase) {
        const updates: any = { status };
        if (progress !== undefined) updates.progress = progress;
        if (pdfUrl) updates.pdf_url = pdfUrl;
        if (status === 'completed') updates.completed_at = new Date().toISOString();

        const { error } = await supabase
            .from('jobs')
            .update(updates)
            .eq('id', jobId);

        if (error) {
            console.error('Supabase job update error:', error);
        } else {
            console.log(`📊 Updated job in Supabase ${jobId}: ${status} ${progress ? `(${progress}%)` : ''}`);
        }
        return;
    }

    if (pool) {
        try {
            const completedAt = status === 'completed' ? 'NOW()' : null;

            await pool.query(
                `UPDATE jobs 
                 SET status = $1, 
                     progress = COALESCE($2, progress),
                     pdf_url = COALESCE($3, pdf_url),
                     completed_at = COALESCE($4, completed_at)
                 WHERE id = $5`,
                [status, progress, pdfUrl, completedAt, jobId]
            );

            console.log(`📊 Updated job in PostgreSQL ${jobId}: ${status} ${progress ? `(${progress}%)` : ''}`);
        } catch (error) {
            console.error('PostgreSQL job update error:', error);
        }
        return;
    }

    const job = inMemoryJobs.get(jobId);
    if (job) {
        job.status = status;
        if (progress !== undefined) job.progress = progress;
        if (pdfUrl) job.pdf_url = pdfUrl;
        if (status === 'completed') job.completed_at = new Date();
        console.log(`📊 Updated job in memory ${jobId}: ${status} ${progress ? `(${progress}%)` : ''}`);
    }
}

/**
 * Get job information
 */
export async function getJob(jobId: string): Promise<any> {
    if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (error) return null;
        return data;
    }

    if (pool) {
        try {
            const result = await pool.query(
                `SELECT id, text_id, status, settings, pdf_url, progress, created_at, completed_at
                 FROM jobs WHERE id = $1`,
                [jobId]
            );

            if (result.rows.length === 0) return null;
            return result.rows[0];
        } catch (error) {
            console.error('PostgreSQL job get error:', error);
            return null;
        }
    }

    return inMemoryJobs.get(jobId) || null;
}

/**
 * Upload PDF to Supabase Storage
 */
export async function uploadPDF(
    buffer: Buffer,
    jobId: string
): Promise<string> {
    if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase not configured - cannot upload PDF');
    }

    const fileName = `${jobId}.pdf`;

    const { data, error } = await supabase.storage
        .from('pdfs')
        .upload(fileName, buffer, {
            contentType: 'application/pdf',
            upsert: true
        });

    if (error) throw new Error(`PDF upload failed: ${error.message}`);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('pdfs')
        .getPublicUrl(fileName);

    console.log(`📤 Uploaded PDF to Supabase: ${publicUrl}`);
    return publicUrl;
}

/**
 * Delete PDF from Supabase Storage
 */
export async function deletePDF(jobId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    const fileName = `${jobId}.pdf`;
    const { error } = await supabase.storage
        .from('pdfs')
        .remove([fileName]);

    if (error) {
        console.error(`Failed to delete PDF: ${error.message}`);
    } else {
        console.log(`🗑️  Deleted PDF from Supabase: ${fileName}`);
    }
}
