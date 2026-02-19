import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { selfAudit } from "@/lib/knowledge/ai-paralegal"

export async function POST(req: NextRequest) {
  return Sentry.startSpan({ op: "http.server", name: "POST /api/knowledge/audit" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const body = await req.json()
      const { leadId } = body

      if (!leadId) {
        return NextResponse.json({ error: "Lead ID is required" }, { status: 400 })
      }

      const auditResult = await selfAudit(leadId)

      return NextResponse.json(auditResult)
    } catch (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: "Failed to perform audit" }, { status: 500 })
    }
  })
}
