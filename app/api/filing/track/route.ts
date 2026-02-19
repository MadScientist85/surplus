import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { TrackingEngine } from "@/lib/filing/tracking-engine"

const { logger } = Sentry

export async function GET(req: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/filing/track",
    },
    async () => {
      try {
        const { userId } = await auth()
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const leadId = searchParams.get("leadId")

        if (!leadId) {
          return NextResponse.json({ error: "leadId is required" }, { status: 400 })
        }

        logger.info("Status check requested", { userId, leadId })

        const tracker = new TrackingEngine()
        const status = await tracker.checkStatus(leadId)

        return NextResponse.json({
          leadId,
          status,
        })
      } catch (error) {
        logger.error("Track API failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        })

        Sentry.captureException(error)

        return NextResponse.json({ error: "Failed to check status" }, { status: 500 })
      }
    },
  )
}
