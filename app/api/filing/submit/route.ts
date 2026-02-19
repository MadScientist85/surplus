import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { PaperworkBot } from "@/lib/filing/paperwork-bot"

const { logger } = Sentry

export async function POST(req: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/filing/submit",
    },
    async () => {
      try {
        const { userId } = await auth()
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { leadId, leadIds } = await req.json()

        logger.info("Filing submission requested", { userId, leadId, leadIds })

        const bot = new PaperworkBot()

        if (leadIds && Array.isArray(leadIds)) {
          // Batch submission
          await bot.submitBatch(leadIds)

          return NextResponse.json({
            success: true,
            message: `Submitted ${leadIds.length} filings`,
          })
        } else if (leadId) {
          // Single submission
          await bot.submitFiling(leadId)

          return NextResponse.json({
            success: true,
            message: "Filing submitted successfully",
          })
        } else {
          return NextResponse.json({ error: "leadId or leadIds required" }, { status: 400 })
        }
      } catch (error) {
        logger.error("Filing submit API failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        })

        Sentry.captureException(error)

        return NextResponse.json({ error: "Failed to submit filing" }, { status: 500 })
      }
    },
  )
}
