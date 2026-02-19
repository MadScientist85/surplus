import type { NextRequest } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import * as Sentry from "@sentry/nextjs"

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get recent webhook events
    const events = await prisma.webhookEvent.findMany({
      orderBy: { processedAt: "desc" },
      take: 20,
    })

    // Stats by type
    const statsByType = await prisma.webhookEvent.groupBy({
      by: ["type"],
      _count: {
        id: true,
      },
      where: {
        processedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    })

    return Response.json({ events, statsByType })
  } catch (error) {
    Sentry.captureException(error)
    return Response.json({ error: (error as Error).message }, { status: 500 })
  }
}
