import * as Sentry from "@sentry/nextjs"
import { AruSwarm } from "./aru-swarm"
import { QuantumPredictor } from "@/lib/ai/quantum-predictor"

const { logger } = Sentry

export class CronScheduler {
  private aruSwarm: AruSwarm
  private predictor: QuantumPredictor

  constructor() {
    this.aruSwarm = new AruSwarm()
    this.predictor = new QuantumPredictor()
  }

  /**
   * Daily scraping job
   */
  async runDailyScrape(): Promise<void> {
    return Sentry.startSpan(
      {
        op: "cron.daily_scrape",
        name: "Daily ARU Scrape",
      },
      async (span) => {
        logger.info("Starting daily ARU scrape")

        try {
          // 1. Scrape all states
          const leads = await this.aruSwarm.scrapeAllStates()
          span.setAttribute("leadsScraped", leads.length)

          if (leads.length === 0) {
            logger.warn("No leads found in daily scrape")
            return
          }

          // 2. Run quantum predictions
          const predictions = await this.predictor.predictBatch(leads)
          span.setAttribute("predictionsGenerated", predictions.length)

          // 3. Filter high-probability leads
          const highValueLeads = leads.filter((lead, index) => {
            const prediction = predictions[index]
            return prediction.recoveryProbability >= 0.7 && prediction.confidence >= 0.8
          })

          span.setAttribute("highValueLeads", highValueLeads.length)

          // 4. Save to database
          const savedCount = await this.aruSwarm.saveLeads(highValueLeads)

          logger.info("Daily scrape completed successfully", {
            totalLeads: leads.length,
            highValueLeads: highValueLeads.length,
            saved: savedCount,
          })
        } catch (error) {
          logger.error("Daily scrape failed", {
            error: error instanceof Error ? error.message : "Unknown error",
          })

          Sentry.captureException(error)
          throw error
        }
      },
    )
  }
}
