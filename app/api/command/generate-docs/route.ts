import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateIntakePacket } from '@/lib/docs/generator';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { leadId } = await req.json();
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });

        if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

        const docData = await generateIntakePacket(lead);
        await prisma.lead.update({ where: { id: leadId }, data: { packetUrl: docData.url } });

        return NextResponse.json({ success: true, url: docData.url, base64: docData.base64 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate' }, { status: 500 });
    }
}