import * as Sentry from "@sentry/nextjs"
import { prisma } from "@/lib/prisma"
import { getAllCircuitBreakers } from "@/lib/error-handling/resilient-fetch"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export interface HealthStatus {
  status: "healthy" | "degraded" | "down"
  timestamp: string
  checks: {
    database: boolean
    redis: boolean
    supabase: boolean
    circuitBreakers: Record<string, any>
  }
  uptime: number
}

const startTime = Date.now()

export async function performHealthCheck(): Promise<HealthStatus> {
  return Sentry.startSpan({ op: "health.check", name: "Perform Health Check" }, async () => {
    const checks = {
      database: await checkDatabase(),
      redis: await checkRedis(),
      supabase: await checkSupabase(),
      circuitBreakers: getAllCircuitBreakers(),
    }

    const allHealthy = checks.database && checks.redis && checks.supabase
    const anyHealthy = checks.database || checks.redis || checks.supabase

    const status: HealthStatus["status"] = allHealthy ? "healthy" : anyHealthy ? "degraded" : "down"

    return {
      status,
      timestamp: new Date().toISOString(),
      checks,
      uptime: Date.now() - startTime,
    }
  })
}

async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    Sentry.captureException(error)
    return false
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    const { kv } = await import("@vercel/kv")
    await kv.ping()
    return true
  } catch (error) {
    Sentry.captureException(error)
    return false
  }
}

async function checkSupabase(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from("knowledge_base").select("id").limit(1)
    return !error
  } catch (error) {
    Sentry.captureException(error)
    return false
  }
}

export async function getSystemMetrics() {
  return Sentry.startSpan({ op: "metrics.collect", name: "Collect System Metrics" }, async () => {
    const [totalLeads, todayLeads, activeARURuns, pendingFilings, bountyStats] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.aruRun.count({
        where: { status: "running" },
      }),
      prisma.filing.count({
        where: { status: "pending" },
      }),
      prisma.bounty.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: { status: "paid" },
      }),
    ])

    return {
      leads: {
        total: totalLeads,
        today: todayLeads,
      },
      aru: {
        activeRuns: activeARURuns,
      },
      filings: {
        pending: pendingFilings,
      },
      bounties: {
        totalPaid: bountyStats._sum.amount || 0,
        count: bountyStats._count.id,
      },
    }
  })
}
