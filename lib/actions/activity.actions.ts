"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export interface ActivityFilters {
  action?: string
  resource?: string
  startDate?: Date
  endDate?: Date
  limit?: number
}

// Get user activity logs
export async function getUserActivity(filters?: ActivityFilters) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const where: any = { userId }

  if (filters?.action) where.action = filters.action
  if (filters?.resource) where.resource = filters.resource
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = filters.startDate
    if (filters.endDate) where.createdAt.lte = filters.endDate
  }

  return await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters?.limit || 50,
  })
}

// Log activity (internal use)
export async function logActivity(data: {
  action: string
  resource?: string
  resourceId?: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}) {
  const { userId } = await auth()
  if (!userId) return null

  return await prisma.activityLog.create({
    data: {
      userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      metadata: data.metadata,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  })
}

// Get dashboard stats
export async function getDashboardStats() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [totalLeads, activeLeads, recoveredLeads, weeklyActivity, totalRecovered, recentLeads] = await Promise.all([
    prisma.lead.count({ where: { userId } }),
    prisma.lead.count({ where: { userId, status: { in: ["new", "enriched", "contacted", "filed"] } } }),
    prisma.lead.count({ where: { userId, status: "recovered" } }),
    prisma.activityLog.count({ where: { userId, createdAt: { gte: weekAgo } } }),
    prisma.lead.aggregate({
      where: { userId, status: "recovered" },
      _sum: { recoveredAmount: true },
    }),
    prisma.lead.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  // Calculate success rate
  const totalClosed = await prisma.lead.count({
    where: { userId, status: { in: ["recovered", "filed"] } },
  })
  const successRate = totalClosed > 0 ? Math.round((recoveredLeads / totalClosed) * 100) : 0

  return {
    totalLeads,
    activeLeads,
    recoveredLeads,
    weeklyActivity,
    totalRecovered: totalRecovered._sum.recoveredAmount || 0,
    successRate,
    recentLeads,
  }
}
