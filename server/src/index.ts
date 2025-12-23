import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import mammoth from 'mammoth';
const pdfParse = require('pdf-parse');
import { saveText } from './services/storage';
import { addGenerationJob, initWorker, pdfQueue } from './services/queue';

const app = express();
const upload = multer({ dest: 'uploads/temp' }); // Temp multer storage

app.use(cors());
app.use(express.json());

// Initialize Worker (for single-process MVP)
initWorker();

app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const filePath = req.file.path;
        let text = '';

        // Extract Text
        if (req.file.mimetype === 'application/pdf') {
            const buffer = await fs.readFile(filePath);
            const data = await pdfParse(buffer);
            text = data.text;
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ path: filePath });
            text = result.value;
        } else {
            // Assume plain text
            text = await fs.readFile(filePath, 'utf-8');
        }

        // Cleanup temp file
        await fs.unlink(filePath);

        // Save to storage
        const textId = await saveText(text);

        // Return 
        // We trim the preview to 5000 chars to avoid massive payloads
        res.json({
            textId,
            preview: text.slice(0, 5000),
            totalLength: text.length
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Processing failed' });
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
    // Ideally we verify the job exists and is done, but for speed:
    // We expect the file at output/ID.pdf
    const filePath = path.join(process.cwd(), 'output', `${req.params.id}.pdf`);
    try {
        await fs.access(filePath);
        res.download(filePath);
    } catch {
        res.status(404).json({ error: 'File not found' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
