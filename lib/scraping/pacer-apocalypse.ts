import * as Sentry from "@sentry/nextjs"
import { parsePDF } from "./pdf-apocalypse"
import { prisma } from "../prisma"

interface PacerCase {
  caseNumber: string
  district: string
  surplusAmount: number
  pdfUrl: string
  ownerName?: string
  county?: string
}

export async function pacerApocalypse(district = "okwd", daysBack = 90): Promise<PacerCase[]> {
  const span = Sentry.startSpan({ name: "pacer.scrape" })
  const cases: PacerCase[] = []

  try {
    // Note: PACER requires authentication and costs $0.10/page
    // This is a simplified version - full implementation would use Playwright/Puppeteer

    const searchUrl = `https://ecf.${district}.uscourts.gov/cgi-bin/iquery.pl`

    // For MVP, we'll use the PACER API if available
    // Otherwise, manual scraping with credentials would be needed

    console.log("[v0] PACER scraping requires valid credentials and payment setup")
    console.log("[v0] District:", district, "Days back:", daysBack)

    // Placeholder: In production, this would authenticate and scrape
    // For now, return empty array and log the requirement

    Sentry.captureMessage("PACER scraping initiated - requires manual setup", "info")
  } catch (error) {
    Sentry.captureException(error)
  } finally {
    span?.end()
  }

  return cases
}

export async function extractPacerPDF(url: string): Promise<string | null> {
  try {
    // Download and parse PDF
    const text = await parsePDF(url)
    return text
  } catch (error) {
    Sentry.captureException(error)
    return null
  }
}

export async function savePacerCase(caseData: PacerCase): Promise<void> {
  await prisma.lead.create({
    data: {
      name: caseData.ownerName || `PACER ${caseData.caseNumber}`,
      surplusAmount: caseData.surplusAmount,
      county: caseData.county || caseData.district.toUpperCase(),
      state: caseData.district.substring(0, 2).toUpperCase(),
      source: `PACER-${caseData.district}`,
      status: "new",
      userId: "system",
    },
  })
}
