import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { prisma } from "@/lib/prisma"

export async function GET() {
  return Sentry.startSpan({ op: "http.server", name: "GET /api/dashboard/map-data" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      // Get lead data by state
      const leadsByState = await prisma.lead.groupBy({
        by: ["state"],
        _count: { id: true },
        _sum: { claimAmount: true },
      })

      // Get ARU status by state
      const aruRuns = await prisma.aruRun.findMany({
        where: { status: "completed" },
        orderBy: { runAt: "desc" },
        distinct: ["state"],
      })

      const aruStatusMap = new Map(aruRuns.map((run) => [run.state, run]))

      // Get replication status
      const replications = await prisma.aruReplication.findMany({
        where: { enabled: true },
      })

      const replicationMap = new Map(replications.map((rep) => [rep.state, true]))

      // Combine data
      const stateData = leadsByState.map((state) => ({
        state: state.state,
        leads: state._count.id,
        claimValue: state._sum.claimAmount || 0,
        aruEnabled: replicationMap.has(state.state),
        lastRun: aruStatusMap.get(state.state)?.runAt?.toISOString(),
      }))

      // Add states with no leads but ARU enabled
      for (const rep of replications) {
        if (!leadsByState.find((s) => s.state === rep.state)) {
          stateData.push({
            state: rep.state,
            leads: 0,
            claimValue: 0,
            aruEnabled: true,
            lastRun: aruStatusMap.get(rep.state)?.runAt?.toISOString(),
          })
        }
      }

      return NextResponse.json({ states: stateData })
    } catch (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: "Failed to fetch map data" }, { status: 500 })
    }
  })
}
