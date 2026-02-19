import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { PaperworkBot } from "@/lib/filing/paperwork-bot"
import { prisma } from "@/lib/prisma"

const { logger } = Sentry

export async function POST(req: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/filing/auto-fill",
    },
    async () => {
      try {
        const { userId } = await auth()
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { leadId } = await req.json()

        if (!leadId) {
          return NextResponse.json({ error: "leadId is required" }, { status: 400 })
        }

        logger.info("Auto-fill form requested", { userId, leadId })

        const lead = await prisma.lead.findUnique({
          where: { id: leadId },
        })

        if (!lead) {
          return NextResponse.json({ error: "Lead not found" }, { status: 404 })
        }

        const bot = new PaperworkBot()
        const pdfBytes = await bot.generateFilingForm({
          leadId: lead.id,
          claimantName: lead.claimantName,
          propertyAddress: lead.propertyAddress || undefined,
          state: lead.state,
          county: lead.county || undefined,
          claimAmount: Number(lead.claimAmount),
          phone: lead.phone || undefined,
          email: lead.email || undefined,
          mailingAddress: lead.mailingAddress || undefined,
        })

        // Return PDF as blob
        return new NextResponse(pdfBytes, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="filing-${leadId}.pdf"`,
          },
        })
      } catch (error) {
        logger.error("Auto-fill API failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        })

        Sentry.captureException(error)

        return NextResponse.json({ error: "Failed to generate form" }, { status: 500 })
      }
    },
  )
}
