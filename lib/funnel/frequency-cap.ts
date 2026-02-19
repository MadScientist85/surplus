import * as Sentry from "@sentry/nextjs"
import { Redis } from "@upstash/redis"

const { logger } = Sentry

export class FrequencyCap {
  private redis: Redis
  private maxDailySms: number

  constructor() {
    this.redis = Redis.fromEnv()
    this.maxDailySms = Number.parseInt(process.env.MAX_DAILY_SMS || "3")
  }

  /**
   * Check if lead can receive message within frequency cap
   */
  async checkLimit(leadId: string, type: "sms" | "email"): Promise<boolean> {
    try {
      const key = `frequency:${type}:${leadId}`
      const count = await this.redis.get(key)

      if (!count) return true

      const currentCount = Number.parseInt(count as string)

      if (type === "sms" && currentCount >= this.maxDailySms) {
        logger.warn("SMS frequency cap reached", { leadId, count: currentCount })
        return false
      }

      // Email frequency cap could be different (e.g., 1 per day)
      if (type === "email" && currentCount >= 1) {
        logger.warn("Email frequency cap reached", { leadId, count: currentCount })
        return false
      }

      return true
    } catch (error) {
      logger.error("Frequency check failed", {
        leadId,
        error: error instanceof Error ? error.message : "Unknown error",
      })

      // Fail safe: allow send if check fails
      return true
    }
  }

  /**
   * Record message sent and increment counter
   */
  async recordSend(leadId: string, type: "sms" | "email"): Promise<void> {
    return Sentry.startSpan(
      {
        op: "funnel.frequency_cap",
        name: "Record Send",
      },
      async () => {
        try {
          const key = `frequency:${type}:${leadId}`
          const ttl = 24 * 60 * 60 // 24 hours

          const current = await this.redis.get(key)

          if (!current) {
            await this.redis.setex(key, ttl, "1")
          } else {
            await this.redis.incr(key)
          }

          logger.debug("Send recorded", { leadId, type })
        } catch (error) {
          logger.error("Failed to record send", {
            leadId,
            error: error instanceof Error ? error.message : "Unknown error",
          })

          Sentry.captureException(error)
        }
      },
    )
  }

  /**
   * Get current send count for lead
   */
  async getCount(leadId: string, type: "sms" | "email"): Promise<number> {
    try {
      const key = `frequency:${type}:${leadId}`
      const count = await this.redis.get(key)

      return count ? Number.parseInt(count as string) : 0
    } catch (error) {
      logger.error("Failed to get count", {
        leadId,
        error: error instanceof Error ? error.message : "Unknown error",
      })

      return 0
    }
  }
}
