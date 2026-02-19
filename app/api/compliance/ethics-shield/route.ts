import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { EthicsShield } from "@/lib/compliance/ethics-shield"

const { logger } = Sentry

export async function POST(req: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/compliance/ethics-shield",
    },
    async () => {
      try {
        const { userId } = await auth()
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { claimantName, state, claimAmount, source } = await req.json()

        if (!claimantName || !state || !claimAmount) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        logger.info("Ethics check requested", { userId, claimantName })

        const shield = new EthicsShield()
        const result = await shield.checkLead({
          claimantName,
          state,
          claimAmount,
          source: source || "unknown",
        })

        return NextResponse.json(result)
      } catch (error) {
        logger.error("Ethics shield API failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        })

        Sentry.captureException(error)

        return NextResponse.json({ error: "Failed to run ethics check" }, { status: 500 })
      }
    },
  )
}
