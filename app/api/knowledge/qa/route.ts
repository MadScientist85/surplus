import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { askAIParalegal } from "@/lib/knowledge/ai-paralegal"

export async function POST(req: NextRequest) {
  return Sentry.startSpan({ op: "http.server", name: "POST /api/knowledge/qa" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const body = await req.json()
      const { question, state, leadId, context } = body

      if (!question || typeof question !== "string") {
        return NextResponse.json({ error: "Question is required" }, { status: 400 })
      }

      const response = await askAIParalegal({
        question,
        state,
        leadId,
        context,
      })

      return NextResponse.json(response)
    } catch (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: "Failed to process question" }, { status: 500 })
    }
  })
}
