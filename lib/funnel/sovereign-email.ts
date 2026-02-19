import * as Sentry from "@sentry/nextjs"
import { Tcpa2025 } from "@/lib/compliance/tcpa-2025"
import { AuditLogger } from "@/lib/compliance/audit-logs"

const { logger } = Sentry

export class SovereignEmail {
  private tcpa: Tcpa2025
  private auditLogger: AuditLogger

  constructor() {
    this.tcpa = new Tcpa2025()
    this.auditLogger = new AuditLogger()
  }

  /**
   * Send compliant email
   */
  async send(params: {
    to: string
    subject: string
    content: string
    leadId: string
    userId: string
    hasConsent: boolean
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return Sentry.startSpan(
      {
        op: "outreach.email_send",
        name: "Send Email",
      },
      async (span) => {
        span.setAttribute("leadId", params.leadId)
        span.setAttribute("hasConsent", params.hasConsent)

        try {
          logger.info("Sending email", {
            to: params.to,
            leadId: params.leadId,
            hasConsent: params.hasConsent,
          })

          // Pre-flight compliance check
          const compliance = await this.tcpa.checkEmailCompliance(params.content, {
            recipientEmail: params.to,
            subject: params.subject,
            hasConsent: params.hasConsent,
          })

          if (!compliance.compliant) {
            logger.error("Email failed compliance check", {
              leadId: params.leadId,
              violations: compliance.violations,
            })

            // Log violation
            await this.auditLogger.logViolation(params.userId, "email_compliance", {
              leadId: params.leadId,
              violations: compliance.violations,
            })

            return {
              success: false,
              error: `Compliance violations: ${compliance.violations.join(", ")}`,
            }
          }

          // Send email (placeholder for actual email service)
          // In production, use SendGrid, AWS SES, or similar
          const messageId = `email_${Date.now()}`

          logger.info("Email sent successfully", {
            messageId,
            leadId: params.leadId,
          })

          // Log communication
          await this.auditLogger.logCommunication(params.userId, params.leadId, "email", {
            to: params.to,
            subject: params.subject,
            messageId,
          })

          span.setAttribute("messageId", messageId)

          return { success: true, messageId }
        } catch (error) {
          logger.error("Email send failed", {
            leadId: params.leadId,
            error: error instanceof Error ? error.message : "Unknown error",
          })

          Sentry.captureException(error)

          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          }
        }
      },
    )
  }
}
