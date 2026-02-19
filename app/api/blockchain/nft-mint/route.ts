import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { mintEthicsNFT } from "@/lib/blockchain/nft-mint"

export async function POST(req: NextRequest) {
  return Sentry.startSpan({ op: "http.server", name: "POST /api/blockchain/nft-mint" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const body = await req.json()
      const { leadId, claimAmount, ethicsScore, complianceChecks } = body

      if (!leadId || !claimAmount || !ethicsScore || !complianceChecks) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }

      const txHash = await mintEthicsNFT({
        leadId,
        claimAmount,
        ethicsScore,
        complianceChecks,
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        txHash,
        message: "Ethics NFT minted successfully",
      })
    } catch (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: "Failed to mint NFT" }, { status: 500 })
    }
  })
}
