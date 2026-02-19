import type { NextRequest } from "next/server"
import { processWebhook } from "@/lib/ai/webhook-nexus"
import * as Sentry from "@sentry/nextjs"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const body = formData.get("Body") as string
    const from = formData.get("From") as string

    // Check for STOP keyword
    if (body.toLowerCase().includes("stop")) {
      await processWebhook({
        type: "twilio_stop",
        data: { from, body },
        timestamp: new Date(),
      })
    }

    return new Response("OK", { status: 200 })
  } catch (error) {
    Sentry.captureException(error)
    return new Response("Error", { status: 500 })
  }
}
