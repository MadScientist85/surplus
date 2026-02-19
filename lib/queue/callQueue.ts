import { Queue, Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const connection = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
};

export const outboundCallQueue = new Queue('outbound-calls', { connection });

export const callWorker = new Worker('outbound-calls', async (job: Job) => {
    const { leadId, phone, firstName } = job.data;
    try {
        const blandResponse = await fetch('https://api.bland.ai/v1/calls', {
            method: 'POST',
            headers: {
                'authorization': process.env.BLAND_API_KEY as string,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone_number: phone,
                task: `You are an HBU Asset Recovery Agent calling ${firstName}. Your goal is to see if they are interested in claiming their surplus funds. Keep responses under 2 sentences. Do not give legal advice. Confirm their interest and any missing documents.`,
                webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/bland`,
                record: true,
                metadata: { leadId }
            })
        });
        if (!blandResponse.ok) throw new Error(`Bland AI Error: ${blandResponse.statusText}`);
        await prisma.lead.update({
            where: { id: leadId },
            data: {
                status: 'CALLING',
                callAttempts: { increment: 1 },
                lastCallAt: new Date(),
            }
        });
        return { success: true, leadId };
    } catch (error) {
        console.error(`Job failed for lead ${leadId}:`, error);
        throw error;
    }
}, { connection, concurrency: 50 });
