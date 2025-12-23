import { Job } from 'bullmq';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { renderPageToBuffer } from './renderer';

// Mock storage retrieval - in real app would be DB or S3
import { getStoredText } from '../services/storage';

export async function processJob(job: Job) {
    const { textId, settings } = job.data;

    console.log(`Processing job ${job.id} for text ${textId}`);

    // 1. Fetch Text
    const fullText = await getStoredText(textId);
    if (!fullText) throw new Error('Text not found');

    // 2. Pagination & Rendering Loop
    // We loop until all text is rendered into pages
    let currentText = fullText;
    let pageCount = 0;
    const MAX_PAGES = 500; // Safety limit

    // 3. Create PDF
    const pdfDoc = await PDFDocument.create();

    while (currentText.length > 0 && pageCount < MAX_PAGES) {
        pageCount++;

        // Render one page
        const { buffer, remainingText } = await renderPageToBuffer(currentText, settings);

        // Add to PDF
        const image = await pdfDoc.embedPng(buffer);
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
        });

        // Loop update
        // Check if we made no progress to avoid infinite loop (e.g. word too big for page)
        if (remainingText.length === currentText.length) {
            console.warn('Text did not fit on page, forcing split at partial.');
            // Crude force split to prevent infinite loop
            const snippet = currentText.slice(0, 100);
            currentText = currentText.slice(100);
            if (currentText.length === 0) break;
        } else {
            currentText = remainingText;
        }

        // Report progress (rough estimate based on remaining length vs original)
        const progress = Math.max(0, Math.min(100, ((fullText.length - currentText.length) / fullText.length) * 100));
        await job.updateProgress(progress);
    }

    const pdfBytes = await pdfDoc.save();

    // 4. Save Output
    const outputPath = path.join(process.cwd(), 'output', `${job.id}.pdf`);
    await fs.writeFile(outputPath, pdfBytes);

    return { path: outputPath, filename: `${job.id}.pdf` };
}
