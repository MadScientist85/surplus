import * as Sentry from "@sentry/nextjs"
import { SelfHealingTemplates } from "@/lib/outreach/self-healing"
import { SovereignEmail } from "./sovereign-email"
import { FrequencyCap } from "./frequency-cap"
import { OptOutHandler } from "./opt-out-handler"
import { prisma } from "@/lib/prisma"

const { logger } = Sentry

export class MarketingAutomator {
  private templates: SelfHealingTemplates
  private emailService: SovereignEmail
  private frequencyCap: FrequencyCap
  private optOutHandler: OptOutHandler

  constructor() {
    this.templates = new SelfHealingTemplates()
    this.emailService = new SovereignEmail()
    this.frequencyCap = new FrequencyCap()
    this.optOutHandler = new OptOutHandler()
  }

  /**
   * Run automated outreach campaign
   */
  async runCampaign(params: {
    leadIds: string[]
    type: "sms" | "email"
    purpose: string
    userId: string
  }): Promise<{ sent: number; skipped: number; failed: number }> {
    return Sentry.startSpan(
      {
        op: "outreach.campaign",
        name: "Run Marketing Campaign",
      },
      async (span) => {
        span.setAttribute("leadCount", params.leadIds.length)
        span.setAttribute("type", params.type)

        logger.info("Starting marketing campaign", {
          leads: params.leadIds.length,
          type: params.type,
          purpose: params.purpose,
        })

        let sent = 0
        let skipped = 0
        let failed = 0

        // Generate multiple unique templates
        const templates = await this.templates.generateBatch(
          params.type,
          params.purpose,
          Math.min(5, params.leadIds.length),
          { purpose: params.purpose },
        )

        logger.info("Templates generated for campaign", {
          count: templates.length,
        })

        // Process each lead
        for (const leadId of params.leadIds) {
          try {
            // Get lead data
            const lead = await prisma.lead.findUnique({
              where: { id: leadId },
            })

            if (!lead) {
              logger.warn("Lead not found", { leadId })
              skipped++
              continue
            }

            // Check opt-out status
            const isOptedOut = await this.optOutHandler.checkOptOut(lead.email || lead.phone || "")

            if (isOptedOut) {
              logger.info("Lead opted out, skipping", { leadId })
              skipped++
              continue
            }

            // Check frequency cap
            const canSend = await this.frequencyCap.checkLimit(leadId, params.type)

            if (!canSend) {
              logger.info("Frequency cap reached, skipping", { leadId })
              skipped++
              continue
            }

            // Select template (rotate for uniqueness)
            const template = templates[sent % templates.length]

            // Personalize template
            const content = this.personalizeTemplate(template.content, {
              Name: lead.claimantName,
              Amount: lead.claimAmount.toString(),
              State: lead.state,
            })

            // Send message
            if (params.type === "email" && lead.email) {
              const result = await this.emailService.send({
                to: lead.email,
                subject: template.subject || "Unclaimed Property in Your Name",
                content,
                leadId,
                userId: params.userId,
                hasConsent: true, // Should be verified from lead data
              })

              if (result.success) {
                sent++
                await this.frequencyCap.recordSend(leadId, params.type)
              } else {
                failed++
              }
            }

            // Rate limiting
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } catch (error) {
            logger.error("Campaign send failed for lead", {
              leadId,
              error: error instanceof Error ? error.message : "Unknown error",
            })

            failed++
          }
        }

        logger.info("Campaign completed", { sent, skipped, failed })

        span.setAttribute("sent", sent)
        span.setAttribute("skipped", skipped)
        span.setAttribute("failed", failed)

        return { sent, skipped, failed }
      },
    )
  }

  /**
   * Personalize template with lead data
   */
  private personalizeTemplate(template: string, variables: Record<string, string>): string {
    let result = template

    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\[${key}\\]`, "g"), value)
    }

    return result
  }
}
