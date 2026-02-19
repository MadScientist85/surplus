import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { calculateBounty, createBounty, getBountyHistory } from "@/lib/blockchain/bounty-system"

export async function GET(req: NextRequest) {
  return Sentry.startSpan({ op: "http.server", name: "GET /api/blockchain/bounty" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const history = await getBountyHistory(userId)

      return NextResponse.json(history)
    } catch (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: "Failed to get bounty history" }, { status: 500 })
    }
  })
}

export async function POST(req: NextRequest) {
  return Sentry.startSpan({ op: "http.server", name: "POST /api/blockchain/bounty" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const body = await req.json()
      const { leadId, referrerId, claimAmount } = body

      if (!leadId || !referrerId || !claimAmount) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }

      const bountyAmount = await calculateBounty(claimAmount)

      const txHash = await createBounty({
        leadId,
        referrerId,
        claimAmount,
        bountyAmount,
      })

      return NextResponse.json({
        success: true,
        txHash,
        bountyAmount,
        message: "Bounty created successfully",
      })
    } catch (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: "Failed to create bounty" }, { status: 500 })
    }
  })
}
