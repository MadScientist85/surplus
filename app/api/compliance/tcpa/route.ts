import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { Tcpa2025 } from "@/lib/compliance/tcpa-2025"

const { logger } = Sentry

export async function POST(req: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/compliance/tcpa",
    },
    async () => {
      try {
        const { userId } = await auth()
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { type, content, metadata } = await req.json()

        if (!type || !content || !metadata) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        logger.info("TCPA check requested", { userId, type })

        const tcpa = new Tcpa2025()
        let result

        if (type === "sms") {
          result = await tcpa.checkSmsCompliance(content, metadata)
        } else if (type === "email") {
          result = await tcpa.checkEmailCompliance(content, metadata)
        } else {
          return NextResponse.json({ error: "Invalid type. Must be 'sms' or 'email'" }, { status: 400 })
        }

        return NextResponse.json(result)
      } catch (error) {
        logger.error("TCPA check API failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        })

        Sentry.captureException(error)

        return NextResponse.json({ error: "Failed to run TCPA check" }, { status: 500 })
      }
    },
  )
}
