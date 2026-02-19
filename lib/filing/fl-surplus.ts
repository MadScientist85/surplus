import * as Sentry from "@sentry/nextjs"
import { PDFDocument } from "pdf-lib"
import type { FilingData } from "./paperwork-bot"

const { logger } = Sentry

export class FlSurplus {
  /**
   * Generate Florida surplus claim form
   */
  async generateForm(data: FilingData): Promise<Buffer> {
    return Sentry.startSpan(
      {
        op: "filing.fl_surplus",
        name: "Generate FL Surplus Form",
      },
      async () => {
        try {
          logger.info("Generating FL surplus form", { leadId: data.leadId })

          // Load Florida surplus form template
          // In production, load from data/form-templates/fl/surplus-form.pdf
          const pdfDoc = await PDFDocument.create()
          const page = pdfDoc.addPage([612, 792])

          const { height } = page.getSize()

          page.drawText("FLORIDA SURPLUS FUNDS CLAIM", {
            x: 50,
            y: height - 50,
            size: 18,
          })

          page.drawText(`Claimant: ${data.claimantName}`, {
            x: 50,
            y: height - 100,
            size: 12,
          })

          page.drawText(`County: ${data.county || "Unknown"}`, {
            x: 50,
            y: height - 130,
            size: 12,
          })

          page.drawText(`Property: ${data.propertyAddress || "N/A"}`, {
            x: 50,
            y: height - 160,
            size: 12,
          })

          page.drawText(`Amount: $${data.claimAmount.toFixed(2)}`, {
            x: 50,
            y: height - 190,
            size: 12,
          })

          const pdfBytes = await pdfDoc.save()
          return Buffer.from(pdfBytes)
        } catch (error) {
          logger.error("FL surplus form generation failed", {
            error: error instanceof Error ? error.message : "Unknown error",
          })

          throw error
        }
      },
    )
  }
}
