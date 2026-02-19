import * as Sentry from "@sentry/nextjs"
import { SkipGenieIntegration } from "./skip-genie-integration"
import { ResimpliApi } from "./resimpli-api"
import { MojoApi } from "./mojo-api"
import { SkipForce } from "./skip-force"
import { AccurateAppend } from "./accurate-append"
import { TracerfyApi } from "./tracerfy-api"
import { DncScrubNexus } from "./dnc-scrub-nexus"
import { calculateEnrichmentScore } from "./enrichment-scoring"
import type { EnrichedLead } from "@/lib/types"
import { prisma } from "@/lib/prisma"

const { logger } = Sentry

interface SkipTraceProvider {
  name: string
  priority: number
  execute: (lead: any) => Promise<any>
  timeout: number
  costPerLead: number
}

export class SkipTraceCascade {
  private providers: SkipTraceProvider[]
  private timeout: number
  private dncScrubber: DncScrubNexus

  constructor() {
    this.timeout = Number.parseInt(process.env.SKIP_CASCADE_TIMEOUT || "30000")
    this.dncScrubber = new DncScrubNexus()

    // Initialize providers in priority order
    this.providers = [
      {
        name: "Skip Genie",
        priority: 1,
        execute: (lead) => new SkipGenieIntegration().trace(lead),
        timeout: 10000,
        costPerLead: 0.25,
      },
      {
        name: "Resimpli",
        priority: 2,
        execute: (lead) => new ResimpliApi().trace(lead),
        timeout: 8000,
        costPerLead: 0.3,
      },
      {
        name: "Mojo",
        priority: 3,
        execute: (lead) => new MojoApi().trace(lead),
        timeout: 8000,
        costPerLead: 0.35,
      },
      {
        name: "Skip Force",
        priority: 4,
        execute: (lead) => new SkipForce().trace(lead),
        timeout: 10000,
        costPerLead: 0.4,
      },
      {
        name: "Accurate Append",
        priority: 5,
        execute: (lead) => new AccurateAppend().trace(lead),
        timeout: 12000,
        costPerLead: 0.45,
      },
      {
        name: "Tracerfy",
        priority: 6,
        execute: (lead) => new TracerfyApi().trace(lead),
        timeout: 10000,
        costPerLead: 0.5,
      },
    ]
  }

  /**
   * Execute skip trace with automatic failover cascade
   */
  async trace(leadId: string): Promise<EnrichedLead | null> {
    return Sentry.startSpan(
      {
        op: "skiptrace.cascade",
        name: "Skip Trace Cascade",
      },
      async (span) => {
        span.setAttribute("leadId", leadId)

        try {
          // Get lead from database
          const lead = await prisma.lead.findUnique({
            where: { id: leadId },
          })

          if (!lead) {
            logger.error("Lead not found for skip trace", { leadId })
            return null
          }

          logger.info("Starting skip trace cascade", {
            leadId,
            claimantName: lead.claimantName,
          })

          let enrichedData = null
          let successfulProvider = null

          // Try each provider in sequence until success
          for (const provider of this.providers) {
            try {
              logger.debug(logger.fmt`Attempting skip trace with ${provider.name}`, {
                leadId,
                provider: provider.name,
                priority: provider.priority,
              })

              // Execute with timeout
              const result = await this.executeWithTimeout(provider.execute(lead), provider.timeout)

              if (result && this.validateResult(result)) {
                enrichedData = result
                successfulProvider = provider.name

                // Save successful result
                await prisma.skipTraceResult.create({
                  data: {
                    leadId,
                    provider: provider.name,
                    success: true,
                    data: result,
                  },
                })

                logger.info("Skip trace successful", {
                  leadId,
                  provider: provider.name,
                  priority: provider.priority,
                })

                span.setAttribute("provider", provider.name)
                span.setAttribute("priority", provider.priority)
                break
              }
            } catch (error) {
              logger.warn(logger.fmt`Provider ${provider.name} failed, trying next`, {
                leadId,
                provider: provider.name,
                error: error instanceof Error ? error.message : "Unknown error",
              })

              // Save failed attempt
              await prisma.skipTraceResult.create({
                data: {
                  leadId,
                  provider: provider.name,
                  success: false,
                  data: {
                    error: error instanceof Error ? error.message : "Unknown error",
                  },
                },
              })

              // Continue to next provider
              continue
            }
          }

          if (!enrichedData) {
            logger.error("All skip trace providers failed", { leadId })
            span.setAttribute("allProvidersFailed", true)
            return null
          }

          // DNC Scrubbing
          const dncResults = await this.dncScrubber.scrubLead({
            phone: enrichedData.phone,
            email: enrichedData.email,
          })

          if (dncResults.phoneOnDnc || dncResults.emailOnDnc) {
            logger.warn("Lead found on DNC list", {
              leadId,
              phoneOnDnc: dncResults.phoneOnDnc,
              emailOnDnc: dncResults.emailOnDnc,
            })
          }

          // Calculate enrichment score
          const enrichmentScore = calculateEnrichmentScore(enrichedData)

          // Update lead in database
          const updatedLead = await prisma.lead.update({
            where: { id: leadId },
            data: {
              phone: enrichedData.phone,
              email: enrichedData.email,
              mailingAddress: enrichedData.mailingAddress,
              skipTraceProvider: successfulProvider,
              skipTraceData: enrichedData,
              enrichmentScore,
              dncScrubbed: true,
              status: "enriched",
            },
          })

          logger.info("Lead enrichment completed", {
            leadId,
            provider: successfulProvider,
            enrichmentScore,
            dncScrubbed: true,
          })

          return updatedLead as EnrichedLead
        } catch (error) {
          logger.error("Skip trace cascade failed", {
            leadId,
            error: error instanceof Error ? error.message : "Unknown error",
          })

          Sentry.captureException(error)
          return null
        }
      },
    )
  }

  /**
   * Bulk skip trace with batching
   */
  async traceBulk(leadIds: string[]): Promise<EnrichedLead[]> {
    return Sentry.startSpan(
      {
        op: "skiptrace.bulk",
        name: "Bulk Skip Trace",
      },
      async (span) => {
        span.setAttribute("leadCount", leadIds.length)

        const batchSize = Number.parseInt(process.env.BULK_BATCH_SIZE || "100")
        const results: EnrichedLead[] = []

        logger.info("Starting bulk skip trace", {
          totalLeads: leadIds.length,
          batchSize,
        })

        // Process in batches to avoid overwhelming providers
        for (let i = 0; i < leadIds.length; i += batchSize) {
          const batch = leadIds.slice(i, i + batchSize)

          logger.debug(logger.fmt`Processing batch ${i / batchSize + 1}`, {
            batchNumber: i / batchSize + 1,
            batchSize: batch.length,
          })

          const batchResults = await Promise.allSettled(batch.map((leadId) => this.trace(leadId)))

          batchResults.forEach((result) => {
            if (result.status === "fulfilled" && result.value) {
              results.push(result.value)
            }
          })

          // Rate limiting delay between batches
          if (i + batchSize < leadIds.length) {
            await new Promise((resolve) => setTimeout(resolve, 2000))
          }
        }

        logger.info("Bulk skip trace completed", {
          totalLeads: leadIds.length,
          successful: results.length,
          failureRate: ((leadIds.length - results.length) / leadIds.length) * 100,
        })

        span.setAttribute("successful", results.length)
        return results
      },
    )
  }

  /**
   * Execute promise with timeout
   */
  private async executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs)),
    ])
  }

  /**
   * Validate skip trace result
   */
  private validateResult(result: any): boolean {
    return !!(result && (result.phone || result.email || result.mailingAddress))
  }
}

export async function skipTraceLead(leadId: string) {
  const cascade = new SkipTraceCascade()
  return await cascade.trace(leadId)
}
