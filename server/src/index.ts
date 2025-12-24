// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import mammoth from 'mammoth';
import PDFParse = require('pdf-parse');
import { saveText, getJob } from './services/storage';
import { addGenerationJob, initWorker, pdfQueue } from './services/queue';
import { initDatabase, closeDatabase } from './db';
import { startCleanupScheduler, stopCleanupScheduler } from './services/cleanup';



const app = express();
const upload = multer({ dest: 'uploads/temp' }); // Temp multer storage

app.use(cors());
app.use(express.json());

// Store cleanup interval ID for graceful shutdown
let cleanupIntervalId: NodeJS.Timeout;

// Initialize Database, Worker, and Cleanup Scheduler
(async () => {
    try {
        // Test Supabase connection if configured
        const { testSupabaseConnection } = await import('./supabase');
        await testSupabaseConnection();

        await initDatabase();
        initWorker();
        cleanupIntervalId = startCleanupScheduler();
        console.log('✅ Application initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        process.exit(1);
    }
})();

app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        // Validate file exists
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const fileSize = req.file.size;
        const mimeType = req.file.mimetype;

        console.log(`Processing upload: ${req.file.originalname} (${fileSize} bytes, ${mimeType})`);

        // Validate file size (max 10MB)
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        if (fileSize > MAX_SIZE) {
            await fs.unlink(filePath).catch(() => { });
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        if (!allowedTypes.includes(mimeType)) {
            await fs.unlink(filePath).catch(() => { });
            return res.status(400).json({
                error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.'
            });
        }

        let text = '';

        // Extract Text with better error handling
        try {
            if (mimeType === 'application/pdf') {
                console.log('Extracting text from PDF...');
                const buffer = await fs.readFile(filePath);
                const result = await PDFParse(buffer);
                text = result.text;

                if (!text || text.trim().length === 0) {
                    throw new Error('PDF appears to be empty or contains only images');
                }
            } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                console.log('Extracting text from DOCX...');
                const result = await mammoth.extractRawText({ path: filePath });
                text = result.value;

                if (!text || text.trim().length === 0) {
                    throw new Error('DOCX file appears to be empty');
                }
            } else {
                // Plain text
                console.log('Reading plain text file...');
                text = await fs.readFile(filePath, 'utf-8');

                if (!text || text.trim().length === 0) {
                    throw new Error('Text file is empty');
                }
            }
        } catch (extractError: any) {
            console.error('Text extraction error:', extractError);
            await fs.unlink(filePath).catch(() => { });
            return res.status(500).json({
                error: `Failed to extract text: ${extractError.message}`
            });
        }

        // Cleanup temp file
        await fs.unlink(filePath).catch((err) => {
            console.warn('Failed to cleanup temp file:', err);
        });

        // Post-process text to fix bullet points
        text = cleanExtractedText(text);

        console.log(`Extracted ${text.length} characters`);

        // Save to storage
        const textId = await saveText(text);

        // Return 
        // We trim the preview to 5000 chars to avoid massive payloads
        res.json({
            textId,
            preview: text.slice(0, 5000),
            totalLength: text.length,
            success: true
        });

    } catch (e: any) {
        console.error('Upload processing error:', e);

        // Cleanup temp file if it exists
        if (req.file?.path) {
            await fs.unlink(req.file.path).catch(() => { });
        }

        res.status(500).json({
            error: e.message || 'Processing failed. Please try again.'
        });
    }
});

app.post('/api/generate', async (req, res) => {
    const { textId, settings } = req.body;
    if (!textId || !settings) return res.status(400).json({ error: 'Missing data' });

    const job = await addGenerationJob(textId, settings);
    res.json({ jobId: job.id });
});

app.get('/api/jobs/:id', async (req, res) => {
    const job = await pdfQueue.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue; // Contains path

    res.json({
        id: job.id,
        state,
        progress,
        result: state === 'completed' ? { filename: result.filename } : null
    });
});

app.get('/api/jobs/:id/download', async (req, res) => {
    try {
        // Get job info to check for Supabase URL
        const job = await getJob(req.params.id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.status !== 'completed') {
            return res.status(400).json({ error: 'Job not completed yet' });
        }

        // If job has a Supabase URL, redirect to it
        if (job.pdf_url && job.pdf_url.startsWith('http')) {
            return res.redirect(job.pdf_url);
        }

        // Fallback: serve from local filesystem
        const filePath = path.join(process.cwd(), 'output', `${req.params.id}.pdf`);
        try {
            await fs.access(filePath);
            res.download(filePath);
        } catch {
            res.status(404).json({ error: 'PDF file not found' });
        }
    } catch (error: any) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});

// Manual cleanup endpoint (for testing/admin)
app.post('/api/cleanup', async (req, res) => {
    try {
        const { manualCleanup } = await import('./services/cleanup');
        await manualCleanup();
        res.json({ success: true, message: 'Cleanup completed successfully' });
    } catch (error: any) {
        console.error('Manual cleanup error:', error);
        res.status(500).json({ error: error.message || 'Cleanup failed' });
    }
});


const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        console.log('HTTP server closed');
        if (cleanupIntervalId) {
            stopCleanupScheduler(cleanupIntervalId);
        }
        await closeDatabase();
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('\nSIGINT signal received: closing HTTP server');
    server.close(async () => {
        console.log('HTTP server closed');
        if (cleanupIntervalId) {
            stopCleanupScheduler(cleanupIntervalId);
        }
        await closeDatabase();
        process.exit(0);
    });
});

export function cleanExtractedText(text: string): string {
    // Regex to find bullet points (•, -, *) or numbered lists (1.) followed by a newline 
    // and merging them with the next non-empty line.
    return text.replace(/^([•\-\*]|\d+\.)\n(?=\S)/gm, '$1 ');
}
