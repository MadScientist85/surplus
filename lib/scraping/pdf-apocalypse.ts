import * as Sentry from "@sentry/nextjs"
import { resilientFetch } from "../error-handling/resilient-fetch"

export async function parsePDF(url: string): Promise<string> {
  const span = Sentry.startSpan({ name: "pdf.parse" })

  try {
    const response = await resilientFetch(url)
    const buffer = await response.arrayBuffer()

    // For MVP, we'll use a simple text extraction
    // In production, use pdf-parse or pdfjs-dist
    const decoder = new TextDecoder()
    const text = decoder.decode(buffer)

    return text
  } catch (error) {
    Sentry.captureException(error)
    return ""
  } finally {
    span?.end()
  }
}

export function extractSurplusFromText(text: string): number {
  const patterns = [
    /excess\s+proceeds.*?\$?\s*([\d,]+\.?\d*)/i,
    /surplus\s+funds.*?\$?\s*([\d,]+\.?\d*)/i,
    /overage.*?\$?\s*([\d,]+\.?\d*)/i,
    /disburse.*?\$?\s*([\d,]+\.?\d*)/i,
    /\$\s*([\d,]+\.\d{2}).*?surplus/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const amount = match[1].replace(/,/g, "")
      return Number.parseFloat(amount)
    }
  }

  return 0
}

export function extractOwnerName(text: string): string | null {
  const patterns = [
    /plaintiff[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /owner[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /claimant[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}
