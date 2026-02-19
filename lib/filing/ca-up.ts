import * as Sentry from "@sentry/nextjs"
import { PDFDocument } from "pdf-lib"
import type { FilingData } from "./paperwork-bot"

const { logger } = Sentry

export class CaUp {
  /**
   * Generate California unclaimed property form
   */
  async generateForm(data: FilingData): Promise<Buffer> {
    return Sentry.startSpan(
      {
        op: "filing.ca_up",
        name: "Generate CA UP Form",
      },
      async () => {
        try {
          logger.info("Generating CA unclaimed property form", {
            leadId: data.leadId,
          })

          const pdfDoc = await PDFDocument.create()
          const page = pdfDoc.addPage([612, 792])

          const { height } = page.getSize()

          page.drawText("CALIFORNIA UNCLAIMED PROPERTY CLAIM", {
            x: 50,
            y: height - 50,
            size: 18,
          })

          page.drawText(`Claimant Name: ${data.claimantName}`, {
            x: 50,
            y: height - 100,
            size: 12,
          })

          page.drawText(`Claim Amount: $${data.claimAmount.toFixed(2)}`, {
            x: 50,
            y: height - 130,
            size: 12,
          })

          if (data.phone) {
            page.drawText(`Phone: ${data.phone}`, {
              x: 50,
              y: height - 160,
              size: 12,
            })
          }

          const pdfBytes = await pdfDoc.save()
          return Buffer.from(pdfBytes)
        } catch (error) {
          logger.error("CA UP form generation failed", {
            error: error instanceof Error ? error.message : "Unknown error",
          })

          throw error
        }
      },
    )
  }
}
