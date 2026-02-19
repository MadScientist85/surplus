import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { AuditLogger } from "@/lib/compliance/audit-logs"
import { prisma } from "@/lib/prisma"

const { logger } = Sentry

export async function POST(req: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/compliance/audit",
    },
    async () => {
      try {
        const { userId } = await auth()
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const entry = await req.json()

        logger.info("Audit log entry requested", { userId, action: entry.action })

        const auditLogger = new AuditLogger()
        await auditLogger.log({
          ...entry,
          actor: userId,
        })

        return NextResponse.json({ success: true })
      } catch (error) {
        logger.error("Audit log API failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        })

        Sentry.captureException(error)

        return NextResponse.json({ error: "Failed to log audit entry" }, { status: 500 })
      }
    },
  )
}

export async function GET(req: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/compliance/audit",
    },
    async () => {
      try {
        const { userId } = await auth()
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const limit = Number.parseInt(searchParams.get("limit") || "100")
        const targetType = searchParams.get("targetType")

        logger.info("Audit log query requested", { userId, limit, targetType })

        const where = targetType ? { contentType: targetType } : {}

        const logs = await prisma.complianceScan.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit,
        })

        return NextResponse.json({ logs })
      } catch (error) {
        logger.error("Audit log query failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        })

        Sentry.captureException(error)

        return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
      }
    },
  )
}
