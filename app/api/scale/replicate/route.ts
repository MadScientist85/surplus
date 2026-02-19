import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { replicateToState } from "@/lib/scale/replication-engine"

export async function POST(req: NextRequest) {
  return Sentry.startSpan({ op: "http.server", name: "POST /api/scale/replicate" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const body = await req.json()
      const { state, enabled, aruSchedule, skipTraceProviders, complianceLevel } = body

      if (!state) {
        return NextResponse.json({ error: "State is required" }, { status: 400 })
      }

      const replication = await replicateToState({
        state,
        enabled: enabled !== false,
        aruSchedule: aruSchedule || "0 9 * * *",
        skipTraceProviders: skipTraceProviders || ["skip-genie", "resimpli"],
        complianceLevel: complianceLevel || "standard",
      })

      return NextResponse.json({
        success: true,
        replication,
        message: `ARU replicated to ${state}`,
      })
    } catch (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: "Failed to replicate ARU" }, { status: 500 })
    }
  })
}
