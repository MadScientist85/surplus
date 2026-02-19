import * as Sentry from "@sentry/nextjs"
import { prisma } from "@/lib/prisma"

export interface ReplicationConfig {
  state: string
  enabled: boolean
  aruSchedule: string
  skipTraceProviders: string[]
  complianceLevel: "standard" | "strict"
}

export async function replicateToState(config: ReplicationConfig) {
  return Sentry.startSpan({ op: "scale.replicate", name: "Replicate ARU to State" }, async (span) => {
    span.setAttribute("state", config.state)
    span.setAttribute("enabled", config.enabled)

    try {
      // Create replication record
      const replication = await prisma.aruReplication.create({
        data: {
          state: config.state,
          enabled: config.enabled,
          schedule: config.aruSchedule,
          providers: config.skipTraceProviders,
          complianceLevel: config.complianceLevel,
        },
      })

      const { logger } = Sentry
      logger.info("ARU replicated to new state", {
        state: config.state,
        replication_id: replication.id,
      })

      return replication
    } catch (error) {
      Sentry.captureException(error)
      throw error
    }
  })
}

export async function getActiveReplications() {
  return Sentry.startSpan({ op: "db.query", name: "Get Active Replications" }, async () => {
    const replications = await prisma.aruReplication.findMany({
      where: { enabled: true },
      orderBy: { createdAt: "desc" },
    })

    return replications
  })
}

export async function updateReplicationStatus(replicationId: string, enabled: boolean) {
  return Sentry.startSpan({ op: "db.update", name: "Update Replication Status" }, async (span) => {
    span.setAttribute("replication_id", replicationId)
    span.setAttribute("enabled", enabled)

    const updated = await prisma.aruReplication.update({
      where: { id: replicationId },
      data: { enabled },
    })

    return updated
  })
}
