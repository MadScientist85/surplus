import * as Sentry from "@sentry/nextjs"
import { Redis } from "@upstash/redis"

const { logger } = Sentry

export class OptOutHandler {
  private redis: Redis
  private expiryDays: number

  constructor() {
    this.redis = Redis.fromEnv()
    this.expiryDays = Number.parseInt(process.env.OPT_OUT_EXPIRY_DAYS || "0") // 0 = permanent
  }

  /**
   * Record opt-out request
   */
  async recordOptOut(contact: string, type: "sms" | "email"): Promise<void> {
    return Sentry.startSpan(
      {
        op: "funnel.opt_out",
        name: "Record Opt-Out",
      },
      async (span) => {
        span.setAttribute("type", type)

        try {
          logger.info("Recording opt-out", { contact, type })

          const key = `optout:${type}:${contact}`

          if (this.expiryDays > 0) {
            // Temporary opt-out
            await this.redis.setex(key, this.expiryDays * 24 * 60 * 60, "true")
          } else {
            // Permanent opt-out
            await this.redis.set(key, "true")
          }

          // Also store in global opt-out list
          await this.redis.sadd(`optout:${type}:all`, contact)

          logger.info("Opt-out recorded", { contact, type })
        } catch (error) {
          logger.error("Failed to record opt-out", {
            contact,
            error: error instanceof Error ? error.message : "Unknown error",
          })

          Sentry.captureException(error)
          throw error
        }
      },
    )
  }

  /**
   * Check if contact has opted out
   */
  async checkOptOut(contact: string): Promise<boolean> {
    try {
      // Check both SMS and email opt-out lists
      const [smsOptOut, emailOptOut] = await Promise.all([
        this.redis.get(`optout:sms:${contact}`),
        this.redis.get(`optout:email:${contact}`),
      ])

      return smsOptOut === "true" || emailOptOut === "true"
    } catch (error) {
      logger.error("Opt-out check failed", {
        contact,
        error: error instanceof Error ? error.message : "Unknown error",
      })

      // Fail safe: assume opted out if check fails
      return true
    }
  }

  /**
   * Handle incoming STOP webhook (from Twilio or similar)
   */
  async handleStopWebhook(params: {
    from: string
    body: string
  }): Promise<void> {
    return Sentry.startSpan(
      {
        op: "funnel.stop_webhook",
        name: "Handle STOP Webhook",
      },
      async () => {
        try {
          const stopKeywords = ["stop", "unsubscribe", "cancel", "end", "quit"]
          const body = params.body.toLowerCase().trim()

          if (stopKeywords.includes(body)) {
            logger.info("STOP request received", { from: params.from })

            await this.recordOptOut(params.from, "sms")

            // Send confirmation (placeholder for actual SMS service)
            logger.info("Sending opt-out confirmation", { to: params.from })
          }
        } catch (error) {
          logger.error("STOP webhook handling failed", {
            error: error instanceof Error ? error.message : "Unknown error",
          })

          Sentry.captureException(error)
        }
      },
    )
  }

  /**
   * Get all opted out contacts
   */
  async getOptOutList(type: "sms" | "email"): Promise<string[]> {
    try {
      const members = await this.redis.smembers(`optout:${type}:all`)
      return members as string[]
    } catch (error) {
      logger.error("Failed to fetch opt-out list", {
        type,
        error: error instanceof Error ? error.message : "Unknown error",
      })

      return []
    }
  }
}
