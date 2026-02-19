import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { SelfHealingTemplates } from "@/lib/outreach/self-healing"

const { logger } = Sentry

export async function POST(req: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/funnel/templates",
    },
    async () => {
      try {
        const { userId } = await auth()
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { type, purpose, count, context } = await req.json()

        if (!type || !purpose) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        logger.info("Template generation requested", { userId, type, purpose, count })

        const templates = new SelfHealingTemplates()

        if (count && count > 1) {
          const batch = await templates.generateBatch(type, purpose, count, context || {})
          return NextResponse.json({ templates: batch })
        } else {
          const template = await templates.generateTemplate(type, purpose, context || {})
          return NextResponse.json({ template })
        }
      } catch (error) {
        logger.error("Template generation API failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        })

        Sentry.captureException(error)

        return NextResponse.json({ error: "Failed to generate templates" }, { status: 500 })
      }
    },
  )
}
