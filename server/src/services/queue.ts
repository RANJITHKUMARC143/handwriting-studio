import { Queue, Worker, Job } from 'bullmq';
import { processJob } from '../worker/processor';

const QUEUE_NAME = 'pdf-generation';

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

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
    return await pdfQueue.add('generate', { textId, settings });
}
