import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { getSystemMetrics } from "@/lib/monitoring/health-pings"

export async function GET() {
  return Sentry.startSpan({ op: "http.server", name: "GET /api/monitoring/status" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const metrics = await getSystemMetrics()

      return NextResponse.json({
        status: "operational",
        timestamp: new Date().toISOString(),
        metrics,
      })
    } catch (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: "Failed to get system status" }, { status: 500 })
    }
  })
}
