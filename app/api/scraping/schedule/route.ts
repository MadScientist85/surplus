import { NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { CronScheduler } from "@/lib/scraping/cron-scheduler"

const { logger } = Sentry

// This endpoint is called by Vercel Cron
export async function GET(req: Request) {
  return Sentry.startSpan(
    {
      op: "cron.trigger",
      name: "GET /api/scraping/schedule",
    },
    async () => {
      try {
        // Verify cron secret
        const authHeader = req.headers.get("authorization")
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
          logger.warn("Unauthorized cron request")
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        logger.info("Cron job triggered")

        const scheduler = new CronScheduler()
        await scheduler.runDailyScrape()

        return NextResponse.json({
          success: true,
          message: "Daily scrape completed",
        })
      } catch (error) {
        logger.error("Cron job failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        })

        Sentry.captureException(error)

        return NextResponse.json({ error: "Cron job failed" }, { status: 500 })
      }
    },
  )
}
