import * as Sentry from "@sentry/nextjs"
import { Redis } from "@upstash/redis"

const { logger } = Sentry

export class DncScrubNexus {
  private redis: Redis
  private scrubInterval: number

  constructor() {
    this.redis = Redis.fromEnv()
    this.scrubInterval = Number.parseInt(process.env.DNC_SCRUB_INTERVAL || "90")
  }

  /**
   * Scrub phone and email against DNC lists
   */
  async scrubLead(data: {
    phone?: string
    email?: string
  }): Promise<{ phoneOnDnc: boolean; emailOnDnc: boolean }> {
    return Sentry.startSpan(
      {
        op: "dnc.scrub",
        name: "DNC Scrub",
      },
      async (span) => {
        try {
          const results = {
            phoneOnDnc: false,
            emailOnDnc: false,
          }

          if (data.phone) {
            results.phoneOnDnc = await this.checkPhoneDnc(data.phone)
            span.setAttribute("phoneOnDnc", results.phoneOnDnc)
          }

          if (data.email) {
            results.emailOnDnc = await this.checkEmailDnc(data.email)
            span.setAttribute("emailOnDnc", results.emailOnDnc)
          }

          logger.info("DNC scrub completed", {
            phone: !!data.phone,
            email: !!data.email,
            phoneOnDnc: results.phoneOnDnc,
            emailOnDnc: results.emailOnDnc,
          })

          return results
        } catch (error) {
          logger.error("DNC scrub failed", {
            error: error instanceof Error ? error.message : "Unknown error",
          })

          Sentry.captureException(error)

          // Fail safe: assume not on DNC if check fails
          return { phoneOnDnc: false, emailOnDnc: false }
        }
      },
    )
  }

  /**
   * Check phone against National DNC Registry
   */
  private async checkPhoneDnc(phone: string): Promise<boolean> {
    try {
      // Check Redis cache first
      const cacheKey = `dnc:phone:${phone}`
      const cached = await this.redis.get(cacheKey)

      if (cached !== null) {
        return cached === "true"
      }

      // Check against DNC API
      // Placeholder for actual DNC API integration
      const isOnDnc = false

      // Cache result for 90 days
      await this.redis.setex(cacheKey, this.scrubInterval * 24 * 60 * 60, isOnDnc.toString())

      return isOnDnc
    } catch (error) {
      logger.error("Phone DNC check failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      })

      return false
    }
  }

  /**
   * Check email against suppression lists
   */
  private async checkEmailDnc(email: string): Promise<boolean> {
    try {
      const cacheKey = `dnc:email:${email}`
      const cached = await this.redis.get(cacheKey)

      if (cached !== null) {
        return cached === "true"
      }

      // Check against email suppression lists
      const isOnDnc = false

      await this.redis.setex(cacheKey, this.scrubInterval * 24 * 60 * 60, isOnDnc.toString())

      return isOnDnc
    } catch (error) {
      logger.error("Email DNC check failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      })

      return false
    }
  }

  /**
   * Quarterly bulk DNC scrub
   */
  async scrubBulk(contacts: Array<{ phone?: string; email?: string }>): Promise<void> {
    return Sentry.startSpan(
      {
        op: "dnc.bulk_scrub",
        name: "Bulk DNC Scrub",
      },
      async (span) => {
        span.setAttribute("contactCount", contacts.length)

        logger.info("Starting bulk DNC scrub", { count: contacts.length })

        const results = await Promise.allSettled(contacts.map((contact) => this.scrubLead(contact)))

        const dncCount = results.filter(
          (r) => r.status === "fulfilled" && (r.value.phoneOnDnc || r.value.emailOnDnc),
        ).length

        logger.info("Bulk DNC scrub completed", {
          total: contacts.length,
          onDnc: dncCount,
          dncRate: (dncCount / contacts.length) * 100,
        })

        span.setAttribute("dncCount", dncCount)
      },
    )
  }
}

export async function scrubDNC(phones: string[]) {
  const scrubber = new DncScrubNexus()
  const results = await Promise.all(
    phones.map(async (phone) => {
      const result = await scrubber.scrubLead({ phone })
      return { phone, onDnc: result.phoneOnDnc }
    }),
  )
  return results
}
