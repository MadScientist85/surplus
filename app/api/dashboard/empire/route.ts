import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { prisma } from "@/lib/prisma"

export async function GET() {
  return Sentry.startSpan({ op: "http.server", name: "GET /api/dashboard/empire" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      // Fetch metrics
      const [totalLeads, totalClaimValue, activeStates, bountyPaid] = await Promise.all([
        prisma.lead.count(),
        prisma.lead.aggregate({
          _sum: { claimAmount: true },
        }),
        prisma.aruRun.groupBy({
          by: ["state"],
          where: {
            status: "completed",
            leadsFound: { gt: 0 },
          },
        }),
        prisma.bounty.aggregate({
          _sum: { amount: true },
          where: { status: "paid" },
        }),
      ])

      // Calculate projected revenue
      const avgClaimValue = totalClaimValue._sum.claimAmount || 0
      const revenuePerLead = avgClaimValue * 0.25 // 25% take
      const projectedLeadsBy2027 = 35000 // From business plan
      const projectedRevenue = projectedLeadsBy2027 * revenuePerLead

      // Calculate recovery score
      const recoveryScore = calculateRecoveryScore({
        totalLeads,
        activeStates: activeStates.length,
        avgClaimValue,
      })

      return NextResponse.json({
        totalLeads,
        totalClaimValue: totalClaimValue._sum.claimAmount || 0,
        activeStates: activeStates.length,
        bountyPaid: bountyPaid._sum.amount || 0,
        projectedRevenue,
        recoveryScore,
      })
    } catch (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
    }
  })
}

function calculateRecoveryScore(data: {
  totalLeads: number
  activeStates: number
  avgClaimValue: number
}): number {
  // Score based on automation level, coverage, and value
  let score = 0

  // Lead volume (max 30 points)
  score += Math.min((data.totalLeads / 1000) * 30, 30)

  // State coverage (max 40 points)
  score += (data.activeStates / 50) * 40

  // Average claim value (max 30 points)
  score += Math.min((data.avgClaimValue / 50000) * 30, 30)

  return Math.round(score)
}
