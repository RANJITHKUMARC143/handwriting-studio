import { Queue, Worker, Job } from 'bullmq';
import { processJob } from '../worker/processor';
import { saveJob } from './storage';
import IORedis from 'ioredis';

const QUEUE_NAME = 'pdf-generation';

// Redis Connection Setup
const redisUrl = process.env.REDIS_HOST || 'localhost';
const connectionOptions = {
    maxRetriesPerRequest: null,
};

// Create Redis connection (handle both URL string and split host/port)
const connection = redisUrl.startsWith('redis://')
    ? new IORedis(redisUrl, connectionOptions)
    : new IORedis({
        host: redisUrl,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        ...connectionOptions
    });

export const pdfQueue = new Queue(QUEUE_NAME, { connection });

export function initWorker() {
    const worker = new Worker(QUEUE_NAME, processJob, {
        connection,
        concurrency: 1 // Sequential processing to save memory
    });

    worker.on('completed', (job: Job) => {
        console.log(`Job ${job.id} completed!`);
    });

    worker.on('failed', (job: Job | undefined, err: Error) => {
        console.error(`Job ${job?.id} failed:`, err);
    });

    console.log('Worker initialized');
    return worker;
}

export async function addGenerationJob(textId: string, settings: any) {
    const job = await pdfQueue.add('generate', { textId, settings });

    // Save job to database
    try {
        await saveJob(job.id as string, textId, settings);
    } catch (error) {
        console.error('Failed to save job to database:', error);
        // Continue anyway - the job is in Redis
    }

    return job;
}
