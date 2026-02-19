import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const CallSummarySchema = z.object({
  interested: z.enum(["yes", "no"]),
  reason: z.string(),
  documents_needed: z.array(z.string()),
  urgency_score: z.number().min(0).max(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, transcript } = body; 

    if (!leadId) return NextResponse.json({ error: 'Missing leadId' }, { status: 400 });

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const aiResponse = JSON.stringify({
      interested: "yes",
      reason: "Wants surplus.",
      documents_needed: ["ID Proof"],
      urgency_score: 0.85
    });
    
    const parsedData = CallSummarySchema.parse(JSON.parse(aiResponse));
    const isInterested = parsedData.interested === "yes";
    const qualificationScore = parsedData.urgency_score * lead.estimatedSurplus * (isInterested ? 1 : 0);

    let newStatus = 'ARCHIVED'; 
    if (isInterested) {
      newStatus = qualificationScore > 5000 ? 'QUALIFIED' : 'REQUIRES_REVIEW';
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        interested: isInterested,
        reason: parsedData.reason,
        documentsNeeded: parsedData.documents_needed,
        urgencyScore: parsedData.urgency_score,
        qualificationScore: qualificationScore,
        status: newStatus as any,
      },
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}