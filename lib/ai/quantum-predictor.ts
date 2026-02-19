import * as Sentry from "@sentry/nextjs"
import { generateText } from "ai"
import type { ScrapedLead, QuantumPrediction } from "@/lib/types"

const { logger } = Sentry

export class QuantumPredictor {
  private confidenceThreshold: number

  constructor() {
    this.confidenceThreshold = Number.parseFloat(process.env.PREDICTOR_CONFIDENCE || "0.8")
  }

  /**
   * Predict recovery probability and value using Grok AI
   */
  async predict(lead: ScrapedLead): Promise<QuantumPrediction> {
    return Sentry.startSpan(
      {
        op: "ai.prediction",
        name: "Quantum Predictor Analysis",
      },
      async (span) => {
        span.setAttribute("leadAmount", lead.claimAmount)
        span.setAttribute("state", lead.state)

        try {
          const prompt = `Analyze this unclaimed property lead and predict recovery probability:
          
Claimant: ${lead.claimantName}
State: ${lead.state}
Claim Amount: $${lead.claimAmount}
Property Address: ${lead.propertyAddress || "Unknown"}

Consider:
1. Claim amount (higher = better)
2. Property address availability (easier to locate claimant)
3. State filing complexity
4. Historical recovery rates

Provide:
- Recovery probability (0-1)
- Estimated recoverable value after fees
- Confidence in prediction (0-1)
- Brief reasoning

Format as JSON: { "recoveryProbability": 0.85, "estimatedValue": 7500, "confidence": 0.9, "reasoning": "..." }`

          const { text } = await generateText({
            model: "xai/grok-beta",
            prompt,
          })

          const prediction = JSON.parse(text)

          logger.info("Prediction generated", {
            leadId: lead.claimantName,
            recoveryProb: prediction.recoveryProbability,
            confidence: prediction.confidence,
          })

          span.setAttribute("recoveryProbability", prediction.recoveryProbability)
          span.setAttribute("confidence", prediction.confidence)

          return {
            leadId: lead.claimantName,
            ...prediction,
          }
        } catch (error) {
          logger.error("Prediction failed", {
            lead: lead.claimantName,
            error: error instanceof Error ? error.message : "Unknown error",
          })

          Sentry.captureException(error)

          // Return conservative default
          return {
            leadId: lead.claimantName,
            recoveryProbability: 0.5,
            estimatedValue: lead.claimAmount * 0.75,
            confidence: 0.5,
            reasoning: "Default prediction due to AI error",
          }
        }
      },
    )
  }

  /**
   * Batch predict multiple leads
   */
  async predictBatch(leads: ScrapedLead[]): Promise<QuantumPrediction[]> {
    return Sentry.startSpan(
      {
        op: "ai.batch_prediction",
        name: "Batch Quantum Prediction",
      },
      async (span) => {
        span.setAttribute("leadCount", leads.length)

        const predictions = await Promise.all(leads.map((lead) => this.predict(lead)))

        const highConfidence = predictions.filter((p) => p.confidence >= this.confidenceThreshold)

        logger.info("Batch predictions completed", {
          total: predictions.length,
          highConfidence: highConfidence.length,
        })

        return predictions
      },
    )
  }
}
