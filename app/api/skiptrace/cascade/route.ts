import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { SkipTraceCascade } from "@/lib/skiptrace/cascade"

const { logger } = Sentry

export async function POST(req: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/skiptrace/cascade",
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

        logger.info("Skip trace requested", { userId, leadId })

        const cascade = new SkipTraceCascade()
        const enrichedLead = await cascade.trace(leadId)

        if (!enrichedLead) {
          return NextResponse.json({ error: "Skip trace failed for all providers" }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          lead: enrichedLead,
        })
      } catch (error) {
        logger.error("Skip trace API failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        })

        Sentry.captureException(error)

        return NextResponse.json({ error: "Failed to skip trace lead" }, { status: 500 })
      }
    },
  )
}
