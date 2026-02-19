import { type NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { runDailyApocalypse } from "@/lib/scraping/apocalypse-engine"

export const maxDuration = 300 // 5 minutes

export async function GET(req: NextRequest) {
  const span = Sentry.startSpan({ name: "cron.apocalypse" })

  try {
    // Verify cron secret for security
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const results = await runDailyApocalypse()

    return NextResponse.json({
      success: true,
      message: "Apocalypse Engine v9 Executed",
      results,
    })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  } finally {
    span?.end()
  }
}
