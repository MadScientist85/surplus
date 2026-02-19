import * as Sentry from "@sentry/nextjs"
import { oscnApocalypse } from "./oscn-apocalypse"
import { pacerApocalypse } from "./pacer-apocalypse"
import { endatoEnrich } from "../integrations/endato"
import { createTrelloCard } from "../integrations/trello"
import { verifyBulkEmails } from "../integrations/zerobounce"
import { scrubDNC } from "../skiptrace/dnc-scrub-nexus"
import { prisma } from "../prisma"

export async function runDailyApocalypse(): Promise<{
  totalLeads: number
  highValueLeads: number
  enriched: number
}> {
  const span = Sentry.startSpan({ name: "apocalypse.daily" })

  try {
    console.log("[v0] Starting Daily Apocalypse Engine...")

    // Run all scrapers in parallel
    const [oscnLeads, pacerLeads] = await Promise.all([oscnApocalypse("oklahoma", 180), pacerApocalypse("okwd", 90)])

    // Combine and filter high-value leads ($10K+)
    const allLeads = [...oscnLeads, ...pacerLeads]
    const highValueLeads = allLeads.filter((lead) => lead.surplusAmount >= 10000)

    console.log("[v0] Found", highValueLeads.length, "high-value leads")

    let enrichedCount = 0

    // Enrich each lead
    for (const lead of highValueLeads) {
      try {
        // Skip trace with Endato
        const enriched = await endatoEnrich({
          name: lead.ownerName || "",
          address: lead.address,
          city: lead.city,
          state: lead.state,
        })

        // Verify emails
        const validEmails = await verifyBulkEmails(enriched.emails)

        // Scrub phones against DNC
        const scrubbedPhones = await scrubDNC(enriched.phones)
        const cleanPhones = enriched.phones.filter(
          (phone) => !scrubbedPhones.some((dnc) => dnc.number === phone && dnc.isRegistered),
        )

        // Save to database
        const savedLead = await prisma.lead.create({
          data: {
            name: lead.ownerName || `Case ${lead.caseNumber}`,
            surplusAmount: lead.surplusAmount,
            county: lead.county || "",
            state: lead.state || "OK",
            address: lead.address,
            city: lead.city,
            phones: cleanPhones,
            emails: validEmails,
            source: "Apocalypse Engine v9",
            status: "new",
            userId: "system",
          },
        })

        // Create Trello card for high-priority leads
        if (lead.surplusAmount >= 20000) {
          await createTrelloCard({
            id: savedLead.id,
            name: savedLead.name,
            surplusEstimate: savedLead.surplusAmount,
            county: savedLead.county,
            state: savedLead.state,
            phones: cleanPhones,
            emails: validEmails,
            priority: lead.surplusAmount >= 50000 ? "high" : "medium",
            enrichmentSource: "Apocalypse Engine v9",
          })
        }

        enrichedCount++
      } catch (error) {
        Sentry.captureException(error)
        console.error("[v0] Error enriching lead:", lead.caseNumber, error)
      }
    }

    console.log("[v0] Apocalypse Complete:", enrichedCount, "leads enriched")

    return {
      totalLeads: allLeads.length,
      highValueLeads: highValueLeads.length,
      enriched: enrichedCount,
    }
  } catch (error) {
    Sentry.captureException(error)
    throw error
  } finally {
    span?.end()
  }
}
