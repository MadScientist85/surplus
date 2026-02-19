import * as Sentry from "@sentry/nextjs"
import { prisma } from "@/lib/prisma"

const { logger } = Sentry

export interface AuditLogEntry {
  action: string
  actor: string
  target: string
  targetType: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export class AuditLogger {
  private retentionDays: number

  constructor() {
    this.retentionDays = Number.parseInt(process.env.AUDIT_LOG_RETENTION || "365")
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    return Sentry.startSpan(
      {
        op: "audit.log",
        name: "Audit Log Entry",
      },
      async (span) => {
        span.setAttribute("action", entry.action)
        span.setAttribute("actor", entry.actor)

        try {
          logger.info("Audit log entry", {
            action: entry.action,
            actor: entry.actor,
            target: entry.target,
          })

          // Store in database (using ComplianceScan table as generic audit log)
          await prisma.complianceScan.create({
            data: {
              contentType: entry.targetType,
              content: JSON.stringify(entry),
              compliant: true, // Audit logs are always "compliant"
              risks: entry.details,
            },
          })

          // Also send to Sentry for monitoring
          Sentry.captureMessage(`Audit: ${entry.action}`, {
            level: "info",
            extra: entry,
          })
        } catch (error) {
          logger.error("Failed to write audit log", {
            error: error instanceof Error ? error.message : "Unknown error",
          })

          // Critical: audit logging failure should be captured
          Sentry.captureException(error)
        }
      },
    )
  }

  /**
   * Log lead access
   */
  async logLeadAccess(userId: string, leadId: string, action: "view" | "edit" | "delete"): Promise<void> {
    await this.log({
      action: `lead.${action}`,
      actor: userId,
      target: leadId,
      targetType: "lead",
      details: {
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Log communication sent
   */
  async logCommunication(
    userId: string,
    leadId: string,
    type: "sms" | "email" | "call",
    metadata: Record<string, any>,
  ): Promise<void> {
    await this.log({
      action: `communication.${type}`,
      actor: userId,
      target: leadId,
      targetType: "communication",
      details: {
        type,
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Log filing submission
   */
  async logFiling(userId: string, leadId: string, state: string, status: string): Promise<void> {
    await this.log({
      action: "filing.submit",
      actor: userId,
      target: leadId,
      targetType: "filing",
      details: {
        state,
        status,
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Log compliance violation
   */
  async logViolation(userId: string, violationType: string, details: Record<string, any>): Promise<void> {
    await this.log({
      action: "compliance.violation",
      actor: userId,
      target: violationType,
      targetType: "violation",
      details: {
        ...details,
        severity: "high",
        timestamp: new Date().toISOString(),
      },
    })

    // Also alert via Sentry
    Sentry.captureMessage(`Compliance Violation: ${violationType}`, {
      level: "warning",
      extra: details,
    })
  }
}
