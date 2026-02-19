import * as Sentry from "@sentry/nextjs"
import { generateText } from "ai"
import { Tcpa2025 } from "@/lib/compliance/tcpa-2025"
import { Redis } from "@upstash/redis"

const { logger } = Sentry

export interface MessageTemplate {
  id: string
  type: "sms" | "email"
  subject?: string
  content: string
  variables: string[]
  complianceScore: number
}

export class SelfHealingTemplates {
  private redis: Redis
  private tcpa: Tcpa2025
  private uniquenessTarget: number

  constructor() {
    this.redis = Redis.fromEnv()
    this.tcpa = new Tcpa2025()
    this.uniquenessTarget = 0.95 // 95% unique target
  }

  /**
   * Generate AI-powered message template
   */
  async generateTemplate(
    type: "sms" | "email",
    purpose: string,
    context: Record<string, any>,
  ): Promise<MessageTemplate> {
    return Sentry.startSpan(
      {
        op: "outreach.generate_template",
        name: "Generate Message Template",
      },
      async (span) => {
        span.setAttribute("type", type)
        span.setAttribute("purpose", purpose)

        try {
          logger.info("Generating message template", { type, purpose })

          // Generate initial template with AI
          let content = await this.generateWithAi(type, purpose, context)

          // Check TCPA compliance
          const complianceResult =
            type === "sms"
              ? await this.tcpa.checkSmsCompliance(content, {
                  recipientPhone: "5555555555",
                  hasConsent: true,
                })
              : await this.tcpa.checkEmailCompliance(content, {
                  recipientEmail: "test@example.com",
                  subject: context.subject || "Unclaimed Property",
                  hasConsent: true,
                })

          // Self-heal if not compliant
          if (!complianceResult.compliant) {
            logger.warn("Template not compliant, self-healing", {
              violations: complianceResult.violations,
            })

            content = await this.healTemplate(content, type, complianceResult.violations, complianceResult.fixes)
          }

          // Extract variables
          const variables = this.extractVariables(content)

          // Calculate uniqueness score
          const uniquenessScore = await this.calculateUniqueness(content, type)

          const template: MessageTemplate = {
            id: `${type}_${Date.now()}`,
            type,
            subject: context.subject,
            content,
            variables,
            complianceScore: complianceResult.compliant ? 1.0 : 0.8,
          }

          // Cache template
          await this.redis.setex(`template:${template.id}`, 30 * 24 * 60 * 60, JSON.stringify(template))

          logger.info("Template generated", {
            id: template.id,
            uniqueness: uniquenessScore,
            compliance: template.complianceScore,
          })

          span.setAttribute("uniqueness", uniquenessScore)
          span.setAttribute("compliance", template.complianceScore)

          return template
        } catch (error) {
          logger.error("Template generation failed", {
            error: error instanceof Error ? error.message : "Unknown error",
          })

          Sentry.captureException(error)
          throw error
        }
      },
    )
  }

  /**
   * Generate template content using AI
   */
  private async generateWithAi(type: "sms" | "email", purpose: string, context: Record<string, any>): Promise<string> {
    const maxLength = type === "sms" ? 160 : 500

    const prompt = `Generate a ${type} message for ${purpose} in unclaimed property recovery.

Context:
${JSON.stringify(context, null, 2)}

Requirements:
- Maximum ${maxLength} characters
- Professional and friendly tone
- Include clear call-to-action
- Use variables in brackets like [Name], [Amount], [State]
- ${type === "sms" ? 'Must include "Reply STOP to opt-out"' : "Must include unsubscribe link"}
- No pressure tactics or urgency language
- No guaranteed promises
- Factual and transparent

Generate ONLY the message content, no explanations.`

    const { text } = await generateText({
      model: "xai/grok-beta",
      prompt,
    })

    return text.trim()
  }

  /**
   * Self-heal template to fix compliance issues
   */
  private async healTemplate(
    content: string,
    type: "sms" | "email",
    violations: string[],
    fixes: string[],
  ): Promise<string> {
    return Sentry.startSpan(
      {
        op: "outreach.heal_template",
        name: "Heal Template",
      },
      async () => {
        logger.info("Healing template", { violations: violations.length })

        const prompt = `Fix the following ${type} message to make it TCPA compliant:

Original message:
${content}

Violations:
${violations.join("\n")}

Suggested fixes:
${fixes.join("\n")}

Generate a corrected version that:
1. Addresses all violations
2. Maintains the core message
3. Keeps the same variables in brackets
4. ${type === "sms" ? "Stays under 160 characters" : "Keeps professional length"}

Return ONLY the corrected message, no explanations.`

        const { text } = await generateText({
          model: "xai/grok-beta",
          prompt,
        })

        return text.trim()
      },
    )
  }

  /**
   * Extract variables from template content
   */
  private extractVariables(content: string): string[] {
    const matches = content.match(/\[([^\]]+)\]/g)
    if (!matches) return []

    return Array.from(new Set(matches.map((m) => m.slice(1, -1))))
  }

  /**
   * Calculate template uniqueness vs existing templates
   */
  private async calculateUniqueness(content: string, type: "sms" | "email"): Promise<number> {
    try {
      // Get recent templates of same type
      const keys = await this.redis.keys(`template:${type}_*`)
      const recentTemplates = await Promise.all(keys.slice(0, 10).map((key) => this.redis.get(key)))

      if (recentTemplates.length === 0) return 1.0

      // Simple similarity check (in production, use more sophisticated NLP)
      const contentWords = new Set(content.toLowerCase().split(/\s+/))
      let totalSimilarity = 0

      for (const template of recentTemplates) {
        if (!template) continue

        const templateData = JSON.parse(template as string)
        const templateWords = new Set(templateData.content.toLowerCase().split(/\s+/))

        const intersection = new Set([...contentWords].filter((word) => templateWords.has(word)))
        const similarity = intersection.size / contentWords.size

        totalSimilarity += similarity
      }

      const avgSimilarity = totalSimilarity / recentTemplates.length
      const uniqueness = 1 - avgSimilarity

      return Math.max(0, Math.min(1, uniqueness))
    } catch (error) {
      logger.error("Uniqueness calculation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      })

      return 0.5 // Default to moderate uniqueness if calculation fails
    }
  }

  /**
   * Batch generate multiple unique templates
   */
  async generateBatch(
    type: "sms" | "email",
    purpose: string,
    count: number,
    context: Record<string, any>,
  ): Promise<MessageTemplate[]> {
    return Sentry.startSpan(
      {
        op: "outreach.batch_generate",
        name: "Batch Generate Templates",
      },
      async (span) => {
        span.setAttribute("count", count)

        logger.info("Batch generating templates", { type, purpose, count })

        const templates: MessageTemplate[] = []

        for (let i = 0; i < count; i++) {
          // Slight variation in context to increase uniqueness
          const variedContext = {
            ...context,
            iteration: i,
            tone: ["professional", "friendly", "helpful"][i % 3],
          }

          const template = await this.generateTemplate(type, purpose, variedContext)

          templates.push(template)

          // Small delay to allow Redis cache to update
          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        logger.info("Batch generation completed", {
          generated: templates.length,
          avgUniqueness: templates.reduce((sum, t) => sum + (t.complianceScore || 0), 0) / templates.length,
        })

        return templates
      },
    )
  }
}
