import { NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { performHealthCheck } from "@/lib/monitoring/health-pings"

export async function GET() {
  return Sentry.startSpan({ op: "http.server", name: "GET /api/monitoring/health" }, async () => {
    try {
      const health = await performHealthCheck()

      const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 207 : 503

      return NextResponse.json(health, { status: statusCode })
    } catch (error) {
      Sentry.captureException(error)
      return NextResponse.json(
        {
          status: "down",
          timestamp: new Date().toISOString(),
          error: "Health check failed",
        },
        { status: 503 },
      )
    }
  })
}
