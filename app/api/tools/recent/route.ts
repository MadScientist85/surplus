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

    // Get recent tool executions
    const executions = await prisma.toolExecution.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        toolName: true,
        success: true,
        duration: true,
        createdAt: true,
      },
    })

    // Calculate stats
    const stats = {
      total: executions.length,
      success: executions.filter((e) => e.success).length,
      failed: executions.filter((e) => !e.success).length,
      avgDuration: executions.reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length || 0,
    }

    return Response.json({ executions, stats })
  } catch (error) {
    Sentry.captureException(error)
    return Response.json({ error: (error as Error).message }, { status: 500 })
  }
}
