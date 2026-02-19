import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { MarketingAutomator } from "@/lib/funnel/marketing-automator"

const { logger } = Sentry

export async function POST(req: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/funnel/campaign",
    },
    async () => {
      try {
        const { userId } = await auth()
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { leadIds, type, purpose } = await req.json()

        if (!leadIds || !Array.isArray(leadIds) || !type || !purpose) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        logger.info("Campaign requested", { userId, leadCount: leadIds.length, type })

        const automator = new MarketingAutomator()
        const results = await automator.runCampaign({
          leadIds,
          type,
          purpose,
          userId,
        })

        return NextResponse.json({
          success: true,
          ...results,
        })
      } catch (error) {
        logger.error("Campaign API failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        })

        Sentry.captureException(error)

        return NextResponse.json({ error: "Failed to run campaign" }, { status: 500 })
      }
    },
  )
}
