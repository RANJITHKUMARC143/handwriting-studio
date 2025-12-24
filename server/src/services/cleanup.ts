import fs from 'fs/promises';
import path from 'path';
import { pool } from '../db';

/**
 * Cleanup service to automatically delete old files and database records
 */

const CLEANUP_INTERVAL = 5 * 60 * 1000; // Run cleanup every 5 minutes
const FILE_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Delete files older than the expiry time
 */
async function cleanupOldFiles(directory: string, expiryMs: number): Promise<number> {
    try {
        const files = await fs.readdir(directory);
        const now = Date.now();
        let deletedCount = 0;

        for (const file of files) {
            const filePath = path.join(directory, file);

            try {
                const stats = await fs.stat(filePath);
                const fileAge = now - stats.mtimeMs;

                if (fileAge > expiryMs) {
                    await fs.unlink(filePath);
                    deletedCount++;
                    console.log(`🗑️  Deleted old file: ${file} (age: ${Math.round(fileAge / 60000)} minutes)`);
                }
            } catch (error) {
                console.error(`Error processing file ${file}:`, error);
            }
        }

        return deletedCount;
    } catch (error) {
        console.error(`Error cleaning up directory ${directory}:`, error);
        return 0;
    }
}

/**
 * Delete expired texts from database
 */
async function cleanupExpiredTexts(): Promise<number> {
    if (!pool) {
        // In-memory storage cleanup happens automatically via expiry checks in getText
        return 0;
    }

    try {
        const result = await pool.query(`
            DELETE FROM texts 
            WHERE created_at < NOW() - INTERVAL '30 minutes'
            RETURNING id
        `);

        const count = result.rowCount || 0;
        if (count > 0) {
            console.log(`🗑️  Deleted ${count} expired text records from database`);
        }

        return count;
    } catch (error) {
        console.error('Error cleaning up expired texts:', error);
        return 0;
    }
}

/**
 * Delete old completed/failed jobs from database
 */
async function cleanupOldJobs(): Promise<number> {
    if (!pool) {
        // In-memory storage cleanup not needed for jobs (they're in Redis)
        return 0;
    }

    try {
        const result = await pool.query(`
            DELETE FROM jobs 
            WHERE (status = 'completed' OR status = 'failed')
            AND created_at < NOW() - INTERVAL '30 minutes'
            RETURNING id
        `);

        const count = result.rowCount || 0;
        if (count > 0) {
            console.log(`🗑️  Deleted ${count} old job records from database`);
        }

        return count;
    } catch (error) {
        console.error('Error cleaning up old jobs:', error);
        return 0;
    }
}

/**
 * Run all cleanup tasks
 */
async function runCleanup(): Promise<void> {
    console.log('🧹 Running cleanup tasks...');

    const startTime = Date.now();

    // Cleanup temporary upload files
    const tempFilesDeleted = await cleanupOldFiles(
        path.join(process.cwd(), 'uploads', 'temp'),
        FILE_EXPIRY_TIME
    );

    // Cleanup generated PDF files
    const pdfFilesDeleted = await cleanupOldFiles(
        path.join(process.cwd(), 'output'),
        FILE_EXPIRY_TIME
    );

    // Cleanup database records
    const textsDeleted = await cleanupExpiredTexts();
    const jobsDeleted = await cleanupOldJobs();

    const duration = Date.now() - startTime;

    const totalDeleted = tempFilesDeleted + pdfFilesDeleted + textsDeleted + jobsDeleted;

    if (totalDeleted > 0) {
        console.log(`✅ Cleanup completed in ${duration}ms: ${tempFilesDeleted} temp files, ${pdfFilesDeleted} PDFs, ${textsDeleted} texts, ${jobsDeleted} jobs`);
    }
}

/**
 * Start the cleanup scheduler
 */
export function startCleanupScheduler(): NodeJS.Timeout {
    console.log(`🕐 Cleanup scheduler started (runs every ${CLEANUP_INTERVAL / 60000} minutes)`);
    console.log(`📁 Files and records will be deleted after ${FILE_EXPIRY_TIME / 60000} minutes of inactivity`);

    // Run cleanup immediately on start
    runCleanup();

    // Schedule periodic cleanup
    const intervalId = setInterval(runCleanup, CLEANUP_INTERVAL);

    return intervalId;
}

/**
 * Stop the cleanup scheduler
 */
export function stopCleanupScheduler(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
    console.log('🛑 Cleanup scheduler stopped');
}

/**
 * Manually trigger cleanup (useful for testing)
 */
export async function manualCleanup(): Promise<void> {
    await runCleanup();
}
