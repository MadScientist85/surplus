import type { NextRequest } from "next/server"
import { processWebhook } from "@/lib/ai/webhook-nexus"
import * as Sentry from "@sentry/nextjs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { envelopeId, status, event } = body

    if (status === "completed" || event === "envelope-completed") {
      await processWebhook({
        type: "docusign_signed",
        data: { envelopeId, status },
        timestamp: new Date(),
      })
    }

    return Response.json({ success: true })
  } catch (error) {
    Sentry.captureException(error)
    return Response.json({ error: "Failed" }, { status: 500 })
  }
}
