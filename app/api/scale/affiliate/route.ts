import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { createAffiliate, getAffiliateStats } from "@/lib/scale/viral-nexus"

export async function GET(req: NextRequest) {
  return Sentry.startSpan({ op: "http.server", name: "GET /api/scale/affiliate" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const stats = await getAffiliateStats(userId)

      return NextResponse.json(stats)
    } catch (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: "Failed to get affiliate stats" }, { status: 500 })
    }
  })
}

export async function POST(req: NextRequest) {
  return Sentry.startSpan({ op: "http.server", name: "POST /api/scale/affiliate" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const body = await req.json()
      const { name, email, commissionRate, tier } = body

      if (!name || !email) {
        return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
      }

      const affiliate = await createAffiliate({
        name,
        email,
        commissionRate: commissionRate || 0.05,
        tier: tier || "bronze",
      })

      return NextResponse.json({
        success: true,
        affiliate,
        message: "Affiliate created successfully",
      })
    } catch (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: "Failed to create affiliate" }, { status: 500 })
    }
  })
}
