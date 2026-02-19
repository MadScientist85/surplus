import * as Sentry from "@sentry/nextjs"

const { logger } = Sentry

export interface TcpaCheckResult {
  compliant: boolean
  violations: string[]
  warnings: string[]
  fixes: string[]
}

export class Tcpa2025 {
  private quietHoursStart: number
  private quietHoursEnd: number

  constructor() {
    this.quietHoursStart = Number.parseInt(process.env.QUIET_HOURS_START || "21") // 9 PM
    this.quietHoursEnd = Number.parseInt(process.env.QUIET_HOURS_END || "8") // 8 AM
  }

  /**
   * Check SMS content for TCPA 2025 compliance
   */
  async checkSmsCompliance(
    content: string,
    metadata: {
      recipientPhone: string
      scheduledTime?: Date
      hasConsent: boolean
    },
  ): Promise<TcpaCheckResult> {
    return Sentry.startSpan(
      {
        op: "compliance.tcpa_sms",
        name: "TCPA SMS Check",
      },
      async (span) => {
        const violations: string[] = []
        const warnings: string[] = []
        const fixes: string[] = []

        try {
          logger.debug("Checking SMS TCPA compliance", {
            phone: metadata.recipientPhone,
            hasConsent: metadata.hasConsent,
          })

          // 1. Consent verification
          if (!metadata.hasConsent) {
            violations.push("No documented consent for SMS communication")
            fixes.push("Obtain explicit written consent before sending")
          }

          // 2. Quiet hours check
          const time = metadata.scheduledTime || new Date()
          if (this.isQuietHours(time)) {
            violations.push(
              `Message scheduled during quiet hours (${this.quietHoursStart}:00-${this.quietHoursEnd}:00)`,
            )
            fixes.push(`Reschedule to ${this.quietHoursEnd}:00-${this.quietHoursStart}:00`)
          }

          // 3. Opt-out mechanism
          const hasOptOut = this.checkOptOutMechanism(content)
          if (!hasOptOut) {
            violations.push("Missing clear opt-out instructions")
            fixes.push('Add "Reply STOP to opt-out" at end of message')
          }

          // 4. Sender identification
          const hasIdentification = this.checkSenderIdentification(content)
          if (!hasIdentification) {
            warnings.push("No clear sender identification")
            fixes.push("Include company name in message")
          }

          // 5. Character limit warning
          if (content.length > 160) {
            warnings.push(`Message exceeds 160 characters (${content.length})`)
            fixes.push("Consider shortening message or split into multiple parts")
          }

          // 6. Prohibited content
          const prohibitedCheck = this.checkProhibitedContent(content)
          if (prohibitedCheck.hasProhibited) {
            violations.push(...prohibitedCheck.violations)
            fixes.push(...prohibitedCheck.fixes)
          }

          const compliant = violations.length === 0

          logger.info("TCPA SMS check completed", {
            compliant,
            violations: violations.length,
            warnings: warnings.length,
          })

          span.setAttribute("compliant", compliant)
          span.setAttribute("violationCount", violations.length)

          return { compliant, violations, warnings, fixes }
        } catch (error) {
          logger.error("TCPA SMS check failed", {
            error: error instanceof Error ? error.message : "Unknown error",
          })

          Sentry.captureException(error)

          return {
            compliant: false,
            violations: ["TCPA check system error"],
            warnings: [],
            fixes: ["Manual compliance review required"],
          }
        }
      },
    )
  }

  /**
   * Check email content for compliance
   */
  async checkEmailCompliance(
    content: string,
    metadata: {
      recipientEmail: string
      subject: string
      hasConsent: boolean
    },
  ): Promise<TcpaCheckResult> {
    return Sentry.startSpan(
      {
        op: "compliance.tcpa_email",
        name: "TCPA Email Check",
      },
      async () => {
        const violations: string[] = []
        const warnings: string[] = []
        const fixes: string[] = []

        try {
          // 1. Consent check
          if (!metadata.hasConsent) {
            violations.push("No documented consent for email communication")
            fixes.push("Obtain consent before sending")
          }

          // 2. Unsubscribe mechanism
          const hasUnsubscribe = content.toLowerCase().includes("unsubscribe")
          if (!hasUnsubscribe) {
            violations.push("Missing unsubscribe link")
            fixes.push("Add clear unsubscribe link in email footer")
          }

          // 3. Physical address
          const hasAddress = this.checkPhysicalAddress(content)
          if (!hasAddress) {
            violations.push("Missing physical mailing address (CAN-SPAM)")
            fixes.push("Add company physical address to email footer")
          }

          // 4. Deceptive subject line
          const isDeceptive = this.checkDeceptiveSubject(metadata.subject)
          if (isDeceptive) {
            violations.push("Subject line may be misleading")
            fixes.push("Use clear, non-deceptive subject line")
          }

          const compliant = violations.length === 0

          logger.info("TCPA email check completed", {
            compliant,
            violations: violations.length,
          })

          return { compliant, violations, warnings, fixes }
        } catch (error) {
          logger.error("TCPA email check failed", {
            error: error instanceof Error ? error.message : "Unknown error",
          })

          Sentry.captureException(error)

          return {
            compliant: false,
            violations: ["TCPA check system error"],
            warnings: [],
            fixes: [],
          }
        }
      },
    )
  }

  /**
   * Check if time is during quiet hours
   */
  private isQuietHours(time: Date): boolean {
    const hour = time.getHours()

    if (this.quietHoursStart > this.quietHoursEnd) {
      // Quiet hours span midnight
      return hour >= this.quietHoursStart || hour < this.quietHoursEnd
    }

    return hour >= this.quietHoursStart && hour < this.quietHoursEnd
  }

  /**
   * Check for opt-out mechanism in message
   */
  private checkOptOutMechanism(content: string): boolean {
    const optOutPatterns = [/reply\s+stop/i, /text\s+stop/i, /send\s+stop/i, /opt[\s-]?out/i]

    return optOutPatterns.some((pattern) => pattern.test(content))
  }

  /**
   * Check for sender identification
   */
  private checkSenderIdentification(content: string): boolean {
    // Simple check - in production would be more sophisticated
    const hasCompanyName = content.toLowerCase().includes("hbu") || content.toLowerCase().includes("asset recovery")

    return hasCompanyName
  }

  /**
   * Check for prohibited content
   */
  private checkProhibitedContent(content: string): {
    hasProhibited: boolean
    violations: string[]
    fixes: string[]
  } {
    const violations: string[] = []
    const fixes: string[] = []

    // Check for urgency/pressure tactics
    const pressureWords = [/urgent/i, /act now/i, /limited time/i, /expires soon/i, /don't miss/i]

    pressureWords.forEach((pattern) => {
      if (pattern.test(content)) {
        violations.push("Contains high-pressure language")
        fixes.push("Remove urgency-creating phrases")
      }
    })

    // Check for misleading claims
    const misleadingPatterns = [/guaranteed/i, /100%/i, /risk[- ]free/i, /no cost/i]

    misleadingPatterns.forEach((pattern) => {
      if (pattern.test(content)) {
        violations.push("Contains potentially misleading claims")
        fixes.push("Use factual, non-misleading language")
      }
    })

    return {
      hasProhibited: violations.length > 0,
      violations,
      fixes,
    }
  }

  /**
   * Check for physical address in email
   */
  private checkPhysicalAddress(content: string): boolean {
    // Simple pattern matching for address-like text
    const addressPatterns = [/\d+\s+\w+\s+(street|st|avenue|ave|road|rd|boulevard|blvd)/i, /\w+,\s+[A-Z]{2}\s+\d{5}/]

    return addressPatterns.some((pattern) => pattern.test(content))
  }

  /**
   * Check if subject line is deceptive
   */
  private checkDeceptiveSubject(subject: string): boolean {
    const deceptivePatterns = [
      /re:/i, // Fake reply
      /fwd:/i, // Fake forward
      /urgent/i,
      /action required/i,
      /account suspended/i,
    ]

    return deceptivePatterns.some((pattern) => pattern.test(subject))
  }
}
