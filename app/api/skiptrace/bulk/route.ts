import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { SkipTraceCascade } from "@/lib/skiptrace/cascade"

const { logger } = Sentry

export async function POST(req: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/skiptrace/bulk",
    },
    async () => {
      try {
        const { userId } = await auth()
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { leadIds } = await req.json()

        if (!leadIds || !Array.isArray(leadIds)) {
          return NextResponse.json({ error: "leadIds array is required" }, { status: 400 })
        }

        logger.info("Bulk skip trace requested", {
          userId,
          leadCount: leadIds.length,
        })

        const cascade = new SkipTraceCascade()
        const enrichedLeads = await cascade.traceBulk(leadIds)

        logger.info("Bulk skip trace completed", {
          userId,
          requested: leadIds.length,
          successful: enrichedLeads.length,
        })

        return NextResponse.json({
          success: true,
          total: leadIds.length,
          enriched: enrichedLeads.length,
          leads: enrichedLeads,
        })
      } catch (error) {
        logger.error("Bulk skip trace API failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        })

        Sentry.captureException(error)

        return NextResponse.json({ error: "Failed to bulk skip trace" }, { status: 500 })
      }
    },
  )
}
