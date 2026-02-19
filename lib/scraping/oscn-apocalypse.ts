import * as Sentry from "@sentry/nextjs"
import { resilientFetch } from "../error-handling/resilient-fetch"
import { getStealthHeaders } from "./stealth-nexus"

interface OSCNCase {
  caseNumber: string
  ownerName: string
  surplusAmount: number
  county: string
  state: string
  address?: string
  city?: string
  caseType?: string
  filingDate?: string
}

export async function oscnApocalypse(state = "oklahoma", daysBack = 180): Promise<OSCNCase[]> {
  const span = Sentry.startSpan({ name: "oscn.scrape" })
  const cases: OSCNCase[] = []

  try {
    console.log("[v0] Starting OSCN scraping for", state, "last", daysBack, "days")

    // OSCN.net base URL
    const baseUrl = "https://www.oscn.net"

    // Search for foreclosure cases with surplus funds
    // Note: OSCN requires specific county searches
    const oklahomaCounties = [
      "Oklahoma",
      "Tulsa",
      "Cleveland",
      "Canadian",
      "Comanche",
      "Creek",
      "Rogers",
      "Pottawatomie",
      "Muskogee",
      "Garfield",
    ]

    for (const county of oklahomaCounties.slice(0, 3)) {
      try {
        // Search for CF (Civil Foreclosure) cases
        const searchUrl = `${baseUrl}/dockets/search.php?county=${county}&ct=cf`

        const response = await resilientFetch(searchUrl, {
          headers: getStealthHeaders(),
        })

        const html = await response.text()

        // Parse case numbers from HTML
        const casePattern = /CF-\d{4}-\d+/g
        const caseNumbers = html.match(casePattern) || []

        console.log("[v0] Found", caseNumbers.length, "cases in", county)

        // Process first 10 cases per county (rate limiting)
        for (const caseNum of caseNumbers.slice(0, 10)) {
          try {
            const caseDetails = await scrapeOSCNCase(baseUrl, county, caseNum)
            if (caseDetails && caseDetails.surplusAmount > 0) {
              cases.push(caseDetails)
            }

            // Rate limiting: 1 second between requests
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } catch (error) {
            console.error("[v0] Error scraping case", caseNum, error)
          }
        }
      } catch (error) {
        Sentry.captureException(error)
        console.error("[v0] Error scraping county", county, error)
      }
    }

    console.log("[v0] OSCN scraping complete:", cases.length, "surplus cases found")
  } catch (error) {
    Sentry.captureException(error)
  } finally {
    span?.end()
  }

  return cases
}

async function scrapeOSCNCase(baseUrl: string, county: string, caseNumber: string): Promise<OSCNCase | null> {
  try {
    const caseUrl = `${baseUrl}/dockets/GetCaseInformation.aspx?db=${county}&number=${caseNumber}`

    const response = await resilientFetch(caseUrl, {
      headers: getStealthHeaders(),
    })

    const html = await response.text()

    // Extract surplus information from case details
    const surplusPattern = /surplus.*?\$\s*([\d,]+\.?\d*)/i
    const surplusMatch = html.match(surplusPattern)

    if (!surplusMatch) {
      return null
    }

    const surplusAmount = Number.parseFloat(surplusMatch[1].replace(/,/g, ""))

    // Extract owner/plaintiff name
    const namePattern = /plaintiff.*?<td[^>]*>([^<]+)<\/td>/i
    const nameMatch = html.match(namePattern)
    const ownerName = nameMatch ? nameMatch[1].trim() : "Unknown"

    // Extract property address
    const addressPattern = /property.*?located.*?at[:\s]+([^<]+)/i
    const addressMatch = html.match(addressPattern)
    const address = addressMatch ? addressMatch[1].trim() : undefined

    return {
      caseNumber,
      ownerName,
      surplusAmount,
      county,
      state: "OK",
      address,
      caseType: "CF",
    }
  } catch (error) {
    console.error("[v0] Error scraping case details:", caseNumber, error)
    return null
  }
}
