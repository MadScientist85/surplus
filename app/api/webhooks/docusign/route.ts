import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const envelopeId = body.data.envelopeId;
        const eventStatus = body.event;

        if (eventStatus === 'envelope-completed') {
            const lead = await prisma.lead.findUnique({ where: { docEnvelopeId: envelopeId } });
            if (lead) {
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: {
                        status: 'PACKET_SIGNED',
                        docSignedAt: new Date(),
                        docSignedUrl: `https://your-storage.com/signed/${lead.id}.pdf`
                    }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
    }
}