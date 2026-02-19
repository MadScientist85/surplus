import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { outboundCallQueue } from '@/lib/queue/callQueue';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const leadsToCall = await prisma.lead.findMany({
            where: { status: 'NEW', callAttempts: { lt: 3 } },
            take: 50,
            orderBy: { estimatedSurplus: 'desc' },
        });

        if (leadsToCall.length === 0) return NextResponse.json({ message: 'No new leads.' });

        const jobs = leadsToCall.map((lead) => ({
            name: 'dispatch-ai-call',
            data: { leadId: lead.id, phone: lead.phone, firstName: lead.firstName },
            opts: { attempts: 3, backoff: { type: 'exponential', delay: 60000 } }
        }));

        await outboundCallQueue.addBulk(jobs);

        return NextResponse.json({ success: true, count: leadsToCall.length });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to dispatch' }, { status: 500 });
    }
}