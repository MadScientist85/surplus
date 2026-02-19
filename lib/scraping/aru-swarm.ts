import * as Sentry from "@sentry/nextjs"
import stateLinks from "@/data/50-state-links.json"
import { prisma } from "@/lib/prisma"
import type { StateDatabase, ScrapedLead } from "@/lib/types"

const { logger } = Sentry

export class AruSwarm {
  private states: StateDatabase[]
  private minThreshold: number

  constructor() {
    this.states = stateLinks.states as StateDatabase[]
    this.minThreshold = Number.parseInt(process.env.BULK_MIN_THRESHOLD || "10000")
  }

  /**
   * Run ARU scraping for a specific state
   */
  async scrapeState(stateCode: string): Promise<ScrapedLead[]> {
    return Sentry.startSpan(
      {
        op: "scraping.state",
        name: `Scrape ${stateCode} Database`,
      },
      async (span) => {
        span.setAttribute("state", stateCode)

        try {
          const stateDb = this.states.find((s) => s.state === stateCode)

          if (!stateDb) {
            logger.warn(logger.fmt`State database not found: ${stateCode}`)
            return this.fallbackToMissingMoney(stateCode)
          }

          logger.info("Starting state scrape", { state: stateCode, url: stateDb.url })

          const leads = await this.performScrape(stateDb)
          const filteredLeads = leads.filter((lead) => lead.claimAmount >= this.minThreshold)

          span.setAttribute("leadsFound", filteredLeads.length)
          logger.info("State scrape completed", {
            state: stateCode,
            totalLeads: leads.length,
            filteredLeads: filteredLeads.length,
          })

          // Save ARU run record
          await prisma.aruRun.create({
            data: {
              state: stateCode,
              leadsFound: filteredLeads.length,
              status: "success",
            },
          })

          return filteredLeads
        } catch (error) {
          logger.error("State scrape failed", {
            state: stateCode,
            error: error instanceof Error ? error.message : "Unknown error",
          })

          Sentry.captureException(error)

          await prisma.aruRun.create({
            data: {
              state: stateCode,
              leadsFound: 0,
              status: "failed",
              errorLog: error instanceof Error ? error.message : "Unknown error",
            },
          })

          // Fallback to national search
          return this.fallbackToMissingMoney(stateCode)
        }
      },
    )
  }

  /**
   * Perform the actual scraping based on state config
   */
  private async performScrape(stateDb: StateDatabase): Promise<ScrapedLead[]> {
    // This is a simplified implementation
    // In production, you would use Puppeteer or Playwright

    const response = await fetch(stateDb.url)
    const html = await response.text()

    // Parse HTML and extract leads
    // This is a placeholder - actual implementation would use cheerio or jsdom
    const leads: ScrapedLead[] = []

    // Simulate scraping results
    logger.debug(logger.fmt`Scraped ${stateDb.state} with ${leads.length} results`)

    return leads
  }

  /**
   * Fallback to MissingMoney.com for states without direct integration
   */
  private async fallbackToMissingMoney(stateCode: string): Promise<ScrapedLead[]> {
    return Sentry.startSpan(
      {
        op: "scraping.fallback",
        name: `Fallback: MissingMoney ${stateCode}`,
      },
      async () => {
        logger.info("Using MissingMoney.com fallback", { state: stateCode })

        try {
          // Placeholder for MissingMoney.com API integration
          const fallbackUrl = `https://www.missingmoney.com/api/search?state=${stateCode}`

          // In production, implement actual API call
          return []
        } catch (error) {
          logger.error("Fallback search failed", {
            state: stateCode,
            error: error instanceof Error ? error.message : "Unknown error",
          })

          Sentry.captureException(error)
          return []
        }
      },
    )
  }

  /**
   * Run scraping for all configured states in parallel
   */
  async scrapeAllStates(): Promise<ScrapedLead[]> {
    return Sentry.startSpan(
      {
        op: "scraping.all",
        name: "Scrape All States",
      },
      async (span) => {
        logger.info("Starting ARU Swarm for all states", {
          stateCount: this.states.length,
        })

        const results = await Promise.allSettled(this.states.map((state) => this.scrapeState(state.state)))

        const allLeads: ScrapedLead[] = []
        let successCount = 0
        let failureCount = 0

        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            allLeads.push(...result.value)
            successCount++
          } else {
            failureCount++
            logger.error("State scrape failed in batch", {
              state: this.states[index].state,
              error: result.reason,
            })
          }
        })

        span.setAttribute("totalLeads", allLeads.length)
        span.setAttribute("successCount", successCount)
        span.setAttribute("failureCount", failureCount)

        logger.info("ARU Swarm completed", {
          totalLeads: allLeads.length,
          successCount,
          failureCount,
        })

        return allLeads
      },
    )
  }

  /**
   * Save scraped leads to database
   */
  async saveLeads(leads: ScrapedLead[]): Promise<number> {
    return Sentry.startSpan(
      {
        op: "db.write",
        name: "Save Scraped Leads",
      },
      async (span) => {
        span.setAttribute("leadCount", leads.length)

        try {
          const savedLeads = await prisma.lead.createMany({
            data: leads.map((lead) => ({
              claimantName: lead.claimantName,
              propertyAddress: lead.propertyAddress,
              state: lead.state,
              county: lead.county,
              claimAmount: lead.claimAmount,
              source: lead.source,
              rawData: lead.rawData || {},
              status: "new",
            })),
            skipDuplicates: true,
          })

          logger.info("Leads saved to database", { count: savedLeads.count })
          return savedLeads.count
        } catch (error) {
          logger.error("Failed to save leads", {
            error: error instanceof Error ? error.message : "Unknown error",
          })

          Sentry.captureException(error)
          throw error
        }
      },
    )
  }
}
