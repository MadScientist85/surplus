import * as Sentry from "@sentry/nextjs"
import { PDFDocument } from "pdf-lib"
import type { FilingData } from "./paperwork-bot"

const { logger } = Sentry

export class Ok12os {
  /**
   * Generate Oklahoma 12 OS form
   */
  async generateForm(data: FilingData): Promise<Buffer> {
    return Sentry.startSpan(
      {
        op: "filing.ok_12os",
        name: "Generate OK 12 OS Form",
      },
      async () => {
        try {
          logger.info("Generating OK 12 OS form", { leadId: data.leadId })

          const pdfDoc = await PDFDocument.create()
          const page = pdfDoc.addPage([612, 792])

          const { height } = page.getSize()

          page.drawText("OKLAHOMA 12 O.S. § 2284 CLAIM", {
            x: 50,
            y: height - 50,
            size: 18,
          })

          page.drawText(`Claimant: ${data.claimantName}`, {
            x: 50,
            y: height - 100,
            size: 12,
          })

          page.drawText(`Amount: $${data.claimAmount.toFixed(2)}`, {
            x: 50,
            y: height - 130,
            size: 12,
          })

          const pdfBytes = await pdfDoc.save()
          return Buffer.from(pdfBytes)
        } catch (error) {
          logger.error("OK 12 OS form generation failed", {
            error: error instanceof Error ? error.message : "Unknown error",
          })

          throw error
        }
      },
    )
  }
}
