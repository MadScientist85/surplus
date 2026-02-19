import * as Sentry from "@sentry/nextjs"
import { PDFDocument } from "pdf-lib"
import { CountyDrone } from "./county-drone"
import { FlSurplus } from "./fl-surplus"
import { CaUp } from "./ca-up"
import { Ok12os } from "./ok-12os"
import { TrackingEngine } from "./tracking-engine"
import { prisma } from "@/lib/prisma"

const { logger } = Sentry

export interface FilingData {
  leadId: string
  claimantName: string
  propertyAddress?: string
  state: string
  county?: string
  claimAmount: number
  phone?: string
  email?: string
  mailingAddress?: string
}

export class PaperworkBot {
  private countyDrone: CountyDrone
  private trackingEngine: TrackingEngine
  private revenueTakePercent: number

  constructor() {
    this.countyDrone = new CountyDrone()
    this.trackingEngine = new TrackingEngine()
    this.revenueTakePercent = Number.parseFloat(process.env.REVENUE_TAKE_PERCENT || "25")
  }

  /**
   * Auto-fill and generate state-specific filing forms
   */
  async generateFilingForm(data: FilingData): Promise<Buffer> {
    return Sentry.startSpan(
      {
        op: "filing.generate",
        name: "Generate Filing Form",
      },
      async (span) => {
        span.setAttribute("state", data.state)
        span.setAttribute("leadId", data.leadId)

        try {
          logger.info("Generating filing form", {
            leadId: data.leadId,
            state: data.state,
            claimAmount: data.claimAmount,
          })

          // Get state-specific filing handler
          const stateHandler = this.getStateHandler(data.state)

          if (stateHandler) {
            // Use state-specific form
            const pdfBytes = await stateHandler.generateForm(data)

            logger.info("State-specific form generated", {
              leadId: data.leadId,
              state: data.state,
            })

            return pdfBytes
          }

          // Use generic form for states without specific handlers
          const pdfBytes = await this.generateGenericForm(data)

          logger.info("Generic form generated", {
            leadId: data.leadId,
            state: data.state,
          })

          return pdfBytes
        } catch (error) {
          logger.error("Form generation failed", {
            leadId: data.leadId,
            state: data.state,
            error: error instanceof Error ? error.message : "Unknown error",
          })

          Sentry.captureException(error)
          throw error
        }
      },
    )
  }

  /**
   * Get state-specific filing handler
   */
  private getStateHandler(state: string): any {
    const handlers: Record<string, any> = {
      FL: new FlSurplus(),
      CA: new CaUp(),
      OK: new Ok12os(),
    }

    return handlers[state]
  }

  /**
   * Generate generic claim form for states without specific handlers
   */
  private async generateGenericForm(data: FilingData): Promise<Buffer> {
    return Sentry.startSpan(
      {
        op: "filing.generic_form",
        name: "Generate Generic Form",
      },
      async () => {
        try {
          // Create new PDF document
          const pdfDoc = await PDFDocument.create()
          const page = pdfDoc.addPage([612, 792]) // Letter size

          const { height } = page.getSize()
          const fontSize = 12

          // Add form fields
          page.drawText("UNCLAIMED PROPERTY CLAIM FORM", {
            x: 50,
            y: height - 50,
            size: 18,
          })

          page.drawText(`State: ${data.state}`, {
            x: 50,
            y: height - 100,
            size: fontSize,
          })

          page.drawText(`Claimant Name: ${data.claimantName}`, {
            x: 50,
            y: height - 130,
            size: fontSize,
          })

          page.drawText(`Claim Amount: $${data.claimAmount.toFixed(2)}`, {
            x: 50,
            y: height - 160,
            size: fontSize,
          })

          if (data.propertyAddress) {
            page.drawText(`Property Address: ${data.propertyAddress}`, {
              x: 50,
              y: height - 190,
              size: fontSize,
            })
          }

          if (data.phone) {
            page.drawText(`Phone: ${data.phone}`, {
              x: 50,
              y: height - 220,
              size: fontSize,
            })
          }

          if (data.email) {
            page.drawText(`Email: ${data.email}`, {
              x: 50,
              y: height - 250,
              size: fontSize,
            })
          }

          if (data.mailingAddress) {
            page.drawText(`Mailing Address: ${data.mailingAddress}`, {
              x: 50,
              y: height - 280,
              size: fontSize,
            })
          }

          const pdfBytes = await pdfDoc.save()
          return Buffer.from(pdfBytes)
        } catch (error) {
          logger.error("Generic form generation failed", {
            error: error instanceof Error ? error.message : "Unknown error",
          })

          throw error
        }
      },
    )
  }

  /**
   * Submit filing to state/county
   */
  async submitFiling(leadId: string): Promise<void> {
    return Sentry.startSpan(
      {
        op: "filing.submit",
        name: "Submit Filing",
      },
      async (span) => {
        span.setAttribute("leadId", leadId)

        try {
          const lead = await prisma.lead.findUnique({
            where: { id: leadId },
          })

          if (!lead) {
            throw new Error("Lead not found")
          }

          logger.info("Submitting filing", {
            leadId,
            state: lead.state,
            county: lead.county,
          })

          // Generate form
          const formData: FilingData = {
            leadId: lead.id,
            claimantName: lead.claimantName,
            propertyAddress: lead.propertyAddress || undefined,
            state: lead.state,
            county: lead.county || undefined,
            claimAmount: Number(lead.claimAmount),
            phone: lead.phone || undefined,
            email: lead.email || undefined,
            mailingAddress: lead.mailingAddress || undefined,
          }

          const pdfBytes = await this.generateFilingForm(formData)

          // For Florida counties, use county drone
          if (lead.state === "FL" && lead.county) {
            await this.countyDrone.submitToCounty(lead.county, pdfBytes, formData)
          }

          // Update lead status
          await prisma.lead.update({
            where: { id: leadId },
            data: {
              filingStatus: "submitted",
              filingDate: new Date(),
              status: "filed",
            },
          })

          // Start tracking
          await this.trackingEngine.startTracking(leadId)

          logger.info("Filing submitted successfully", {
            leadId,
            state: lead.state,
          })
        } catch (error) {
          logger.error("Filing submission failed", {
            leadId,
            error: error instanceof Error ? error.message : "Unknown error",
          })

          Sentry.captureException(error)
          throw error
        }
      },
    )
  }

  /**
   * Batch submit multiple filings
   */
  async submitBatch(leadIds: string[]): Promise<void> {
    return Sentry.startSpan(
      {
        op: "filing.batch_submit",
        name: "Batch Submit Filings",
      },
      async (span) => {
        span.setAttribute("leadCount", leadIds.length)

        logger.info("Starting batch filing submission", {
          count: leadIds.length,
        })

        const results = await Promise.allSettled(leadIds.map((leadId) => this.submitFiling(leadId)))

        const successful = results.filter((r) => r.status === "fulfilled").length
        const failed = results.filter((r) => r.status === "rejected").length

        logger.info("Batch filing completed", {
          total: leadIds.length,
          successful,
          failed,
        })

        span.setAttribute("successful", successful)
        span.setAttribute("failed", failed)
      },
    )
  }
}

export async function autoFileClaim(leadId: string, state?: string) {
  const bot = new PaperworkBot()

  // If state is provided, validate lead has required data
  if (state) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    })

    if (lead && lead.state !== state) {
      throw new Error(`Lead state ${lead.state} does not match requested state ${state}`)
    }
  }

  await bot.submitFiling(leadId)
  return { success: true, leadId, status: "submitted" }
}
