import { NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { OptOutHandler } from "@/lib/funnel/opt-out-handler"

const { logger } = Sentry

// Webhook endpoint for SMS STOP requests
export async function POST(req: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/funnel/opt-out",
    },
    async () => {
      try {
        const { from, body } = await req.json()

        if (!from || !body) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        logger.info("Opt-out webhook received", { from })

        const handler = new OptOutHandler()
        await handler.handleStopWebhook({ from, body })

        return NextResponse.json({ success: true })
      } catch (error) {
        logger.error("Opt-out webhook failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        })

        Sentry.captureException(error)

        return NextResponse.json({ error: "Failed to process opt-out" }, { status: 500 })
      }
    },
  )
}

// Get opt-out list
export async function GET(req: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/funnel/opt-out",
    },
    async () => {
      try {
        const { searchParams } = new URL(req.url)
        const type = searchParams.get("type") as "sms" | "email" | null

        if (!type) {
          return NextResponse.json({ error: "Type parameter required (sms or email)" }, { status: 400 })
        }

        const handler = new OptOutHandler()
        const list = await handler.getOptOutList(type)

        return NextResponse.json({ count: list.length, contacts: list })
      } catch (error) {
        logger.error("Opt-out list fetch failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        })

        Sentry.captureException(error)

        return NextResponse.json({ error: "Failed to fetch opt-out list" }, { status: 500 })
      }
    },
  )
}
