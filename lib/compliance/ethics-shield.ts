import * as Sentry from "@sentry/nextjs"
import { generateText } from "ai"
import { Redis } from "@upstash/redis"

const { logger } = Sentry

export interface EthicsCheckResult {
  passed: boolean
  score: number
  flags: string[]
  blockedReasons: string[]
  recommendations: string[]
}

export class EthicsShield {
  private redis: Redis
  private threshold: number

  constructor() {
    this.redis = Redis.fromEnv()
    this.threshold = Number.parseFloat(process.env.ETHICS_THRESHOLD || "0.8")
  }

  /**
   * Check lead against ethics criteria
   */
  async checkLead(leadData: {
    claimantName: string
    state: string
    claimAmount: number
    source: string
  }): Promise<EthicsCheckResult> {
    return Sentry.startSpan(
      {
        op: "compliance.ethics_check",
        name: "Ethics Shield Check",
      },
      async (span) => {
        span.setAttribute("state", leadData.state)
        span.setAttribute("claimAmount", leadData.claimAmount)

        try {
          logger.info("Running ethics check", {
            claimantName: leadData.claimantName,
            state: leadData.state,
          })

          const flags: string[] = []
          const blockedReasons: string[] = []
          const recommendations: string[] = []

          // Check for grief indicators
          const griefCheck = await this.checkForGriefIndicators(leadData.claimantName)
          if (griefCheck.hasIndicators) {
            flags.push("potential_grief_case")
            blockedReasons.push("Lead may involve recent death or grief situation")
          }

          // Check for litigator patterns
          const litigatorCheck = await this.checkForLitigatorPatterns(leadData.claimantName)
          if (litigatorCheck.isLitigator) {
            flags.push("known_litigator")
            blockedReasons.push("Claimant has history of litigation")
          }

          // Check claim amount reasonability
          if (leadData.claimAmount < 1000) {
            flags.push("low_value_claim")
            recommendations.push("Consider if pursuit is economically viable for claimant")
          }

          if (leadData.claimAmount > 1000000) {
            flags.push("high_value_claim")
            recommendations.push("Extra verification recommended for high-value claim")
          }

          // AI-powered ethics analysis
          const aiAnalysis = await this.runAiEthicsAnalysis(leadData)
          flags.push(...aiAnalysis.flags)

          // Calculate ethics score
          const score = this.calculateEthicsScore(flags, blockedReasons)

          const passed = score >= this.threshold && blockedReasons.length === 0

          logger.info("Ethics check completed", {
            claimantName: leadData.claimantName,
            score,
            passed,
            flagCount: flags.length,
          })

          span.setAttribute("ethicsScore", score)
          span.setAttribute("passed", passed)

          return {
            passed,
            score,
            flags,
            blockedReasons,
            recommendations,
          }
        } catch (error) {
          logger.error("Ethics check failed", {
            error: error instanceof Error ? error.message : "Unknown error",
          })

          Sentry.captureException(error)

          // Fail closed - don't proceed if ethics check fails
          return {
            passed: false,
            score: 0,
            flags: ["error_in_check"],
            blockedReasons: ["Ethics verification system error"],
            recommendations: ["Manual review required"],
          }
        }
      },
    )
  }

  /**
   * Check for grief indicators (recent death, probate, etc.)
   */
  private async checkForGriefIndicators(claimantName: string): Promise<{ hasIndicators: boolean; details: string[] }> {
    // Check Redis cache
    const cacheKey = `grief:${claimantName}`
    const cached = await this.redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached as string)
    }

    // In production, check against:
    // - Recent obituaries
    // - Probate filings
    // - Death records databases
    const hasIndicators = false
    const details: string[] = []

    const result = { hasIndicators, details }

    // Cache for 30 days
    await this.redis.setex(cacheKey, 30 * 24 * 60 * 60, JSON.stringify(result))

    return result
  }

  /**
   * Check for known litigator patterns
   */
  private async checkForLitigatorPatterns(claimantName: string): Promise<{ isLitigator: boolean; cases: string[] }> {
    const cacheKey = `litigator:${claimantName}`
    const cached = await this.redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached as string)
    }

    // In production, check against:
    // - Court records
    // - Attorney databases
    // - Known litigious individuals list
    const isLitigator = false
    const cases: string[] = []

    const result = { isLitigator, cases }

    await this.redis.setex(cacheKey, 90 * 24 * 60 * 60, JSON.stringify(result))

    return result
  }

  /**
   * AI-powered ethics analysis using Grok
   */
  private async runAiEthicsAnalysis(leadData: {
    claimantName: string
    state: string
    claimAmount: number
    source: string
  }): Promise<{ flags: string[]; reasoning: string }> {
    try {
      const prompt = `Analyze this unclaimed property lead for ethical concerns:

Claimant: ${leadData.claimantName}
State: ${leadData.state}
Claim Amount: $${leadData.claimAmount}
Source: ${leadData.source}

Identify any potential ethical red flags such as:
- Vulnerable populations (elderly, recent widow/widower)
- Suspicious claim patterns
- Regulatory concerns
- Fairness issues

Return JSON: { "flags": ["flag1", "flag2"], "reasoning": "explanation" }`

      const { text } = await generateText({
        model: "xai/grok-beta",
        prompt,
      })

      const analysis = JSON.parse(text)

      return {
        flags: analysis.flags || [],
        reasoning: analysis.reasoning || "",
      }
    } catch (error) {
      logger.warn("AI ethics analysis failed, continuing with manual checks", {
        error: error instanceof Error ? error.message : "Unknown error",
      })

      return { flags: [], reasoning: "" }
    }
  }

  /**
   * Calculate overall ethics score
   */
  private calculateEthicsScore(flags: string[], blockedReasons: string[]): number {
    if (blockedReasons.length > 0) {
      return 0
    }

    // Start with perfect score
    let score = 1.0

    // Deduct points for flags
    const flagPenalties: Record<string, number> = {
      potential_grief_case: 0.3,
      known_litigator: 0.5,
      low_value_claim: 0.1,
      high_value_claim: 0.05,
      vulnerable_population: 0.2,
    }

    flags.forEach((flag) => {
      const penalty = flagPenalties[flag] || 0.05
      score -= penalty
    })

    return Math.max(0, Math.min(1, score))
  }
}
