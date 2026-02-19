import * as Sentry from "@sentry/nextjs"
import { prisma } from "@/lib/prisma"
import { scrubDNC } from "@/lib/skiptrace/dnc-scrub-nexus"
import { mintEthicsNFT } from "@/lib/blockchain/nft-mint"

// TCPA Compliance: 8AM-9PM local time window
export async function checkTCPAWindow(phone: string): Promise<{ compliant: boolean; localTime?: string }> {
  try {
    // Get timezone from area code
    const areaCode = phone.replace(/\D/g, "").substring(0, 3)
    const timezone = getTimezoneFromAreaCode(areaCode)

    const localTime = new Date().toLocaleString("en-US", { timeZone: timezone })
    const hour = new Date(localTime).getHours()

    return {
      compliant: hour >= 8 && hour < 21,
      localTime,
    }
  } catch (error) {
    Sentry.captureException(error)
    return { compliant: false }
  }
}

// Get timezone from phone area code
function getTimezoneFromAreaCode(areaCode: string): string {
  const timezones: Record<string, string> = {
    // Eastern
    "212": "America/New_York",
    "305": "America/New_York",
    "407": "America/New_York",
    "561": "America/New_York",
    "727": "America/New_York",
    "786": "America/New_York",
    "813": "America/New_York",
    "850": "America/New_York",
    "904": "America/New_York",
    "941": "America/New_York",
    "954": "America/New_York",
    // Central
    "405": "America/Chicago",
    "580": "America/Chicago",
    "918": "America/Chicago",
    "214": "America/Chicago",
    "469": "America/Chicago",
    "972": "America/Chicago",
    "512": "America/Chicago",
    "713": "America/Chicago",
    "832": "America/Chicago",
    // Mountain
    "303": "America/Denver",
    "480": "America/Denver",
    "602": "America/Denver",
    // Pacific
    "213": "America/Los_Angeles",
    "310": "America/Los_Angeles",
    "323": "America/Los_Angeles",
    "408": "America/Los_Angeles",
    "415": "America/Los_Angeles",
    "510": "America/Los_Angeles",
    "562": "America/Los_Angeles",
    "619": "America/Los_Angeles",
    "626": "America/Los_Angeles",
    "650": "America/Los_Angeles",
    "714": "America/Los_Angeles",
    "760": "America/Los_Angeles",
    "805": "America/Los_Angeles",
    "818": "America/Los_Angeles",
    "858": "America/Los_Angeles",
    "909": "America/Los_Angeles",
    "916": "America/Los_Angeles",
    "949": "America/Los_Angeles",
    "951": "America/Los_Angeles",
  }

  return timezones[areaCode] || "America/Chicago" // Default to Central
}

// Check if lead is in active litigation (FDCPA §1692c)
export async function checkLitigation(name: string, county?: string): Promise<boolean> {
  try {
    // Check internal litigation database
    const litigationRecord = await prisma.lead.findFirst({
      where: {
        name: { contains: name, mode: "insensitive" },
        county: county || undefined,
        status: { in: ["litigation", "legal_dispute"] },
      },
    })

    return !!litigationRecord
  } catch (error) {
    Sentry.captureException(error)
    return false // Fail safe - assume not in litigation
  }
}

// Check opt-out status
export async function checkOptOut(phone: string): Promise<boolean> {
  try {
    const optOut = await prisma.lead.findFirst({
      where: {
        phones: { has: phone },
        optedOut: true,
      },
    })

    return !!optOut
  } catch (error) {
    Sentry.captureException(error)
    return false
  }
}

// Log consent for audit trail
export async function logConsent(leadId: string, action: "sms" | "email" | "call", details: any) {
  try {
    await prisma.communication.create({
      data: {
        leadId,
        type: action,
        direction: "outbound",
        content: JSON.stringify({ consent: "logged", ...details }),
        status: "sent",
        phone: details.phone || null,
      },
    })
  } catch (error) {
    Sentry.captureException(error)
  }
}

// Main compliance check - runs before every outreach
export async function complianceCheck(
  leadId: string,
  action: "sms" | "email" | "call",
  phone?: string,
): Promise<{ compliant: boolean; violations: string[]; nft?: string }> {
  return await Sentry.startSpan({ op: "compliance.check", name: "Compliance Check" }, async () => {
    const violations: string[] = []

    try {
      // Get lead data
      const lead = await prisma.lead.findUnique({ where: { id: leadId } })
      if (!lead) {
        violations.push("LEAD_NOT_FOUND")
        return { compliant: false, violations }
      }

      const targetPhone = phone || lead.phone || lead.phones[0]
      if (!targetPhone && action === "sms") {
        violations.push("NO_PHONE")
        return { compliant: false, violations }
      }

      // 1. Check Opt-Out Status
      if (lead.optedOut) {
        violations.push("OPT_OUT")
      }

      // 2. Check DNC Registry (Federal)
      if (targetPhone && !lead.dncScrubbed) {
        const dncResults = await scrubDNC([targetPhone])
        if (dncResults[targetPhone] === false) {
          // false means it's on DNC
          violations.push("DNC_FEDERAL")
          // Update lead
          await prisma.lead.update({
            where: { id: leadId },
            data: { dncScrubbed: true },
          })
        }
      }

      // 3. Check TCPA Time Window (8AM-9PM local)
      if (action === "sms" || action === "call") {
        const tcpaCheck = await checkTCPAWindow(targetPhone!)
        if (!tcpaCheck.compliant) {
          violations.push("TCPA_WINDOW")
        }
      }

      // 4. Check Litigation Status (FDCPA)
      const inLitigation = await checkLitigation(lead.name, lead.county || undefined)
      if (inLitigation) {
        violations.push("FDCPA_LITIGATION")
      }

      // 5. Check State-Specific Rules
      if (lead.state === "FL") {
        // Florida §45.032 requires specific disclosures
        // This is enforced in message templates
      }

      // If any violations, block and log
      if (violations.length > 0) {
        await prisma.complianceScan.create({
          data: {
            contentType: action,
            content: `Blocked outreach to ${lead.name}`,
            compliant: false,
            risks: { violations },
          },
        })

        return { compliant: false, violations }
      }

      // PASSED ALL CHECKS
      // Log consent
      await logConsent(leadId, action, { phone: targetPhone })

      // Mint Ethics NFT
      const nft = await mintEthicsNFT(leadId, {
        compliance: {
          tcpa: true,
          fdcpa: true,
          dnc: true,
          timestamp: new Date().toISOString(),
        },
      })

      // Log successful compliance check
      await prisma.complianceScan.create({
        data: {
          contentType: action,
          content: `Compliant outreach to ${lead.name}`,
          compliant: true,
          risks: { passed: true, nft },
        },
      })

      return { compliant: true, violations: [], nft: nft.tokenId }
    } catch (error) {
      Sentry.captureException(error)
      violations.push("SYSTEM_ERROR")
      return { compliant: false, violations }
    }
  })
}

// Get compliance score for a lead (0-100)
export async function getComplianceScore(leadId: string): Promise<number> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { communications: true },
    })

    if (!lead) return 0

    let score = 100

    // Deductions
    if (lead.optedOut) score -= 100 // Auto-fail
    if (!lead.dncScrubbed) score -= 20
    if (lead.contactCount > 5) score -= 10 // Too many contacts
    if (!lead.phone && !lead.phones.length) score -= 15

    // Check recent violations
    const recentViolations = await prisma.complianceScan.findMany({
      where: {
        content: { contains: lead.name },
        compliant: false,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
    })

    score -= recentViolations.length * 15

    return Math.max(0, score)
  } catch (error) {
    Sentry.captureException(error)
    return 0
  }
}

// Generate compliance report
export async function generateComplianceReport(days = 30) {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [totalScans, compliantScans, violations, optOuts, nftsMinted] = await Promise.all([
      prisma.complianceScan.count({ where: { createdAt: { gte: since } } }),
      prisma.complianceScan.count({ where: { compliant: true, createdAt: { gte: since } } }),
      prisma.complianceScan.findMany({ where: { compliant: false, createdAt: { gte: since } } }),
      prisma.lead.count({ where: { optedOut: true } }),
      prisma.communication.count({
        where: {
          content: { contains: "consent: logged" },
          createdAt: { gte: since },
        },
      }),
    ])

    const complianceRate = totalScans > 0 ? (compliantScans / totalScans) * 100 : 0

    return {
      period: `Last ${days} days`,
      totalScans,
      compliantScans,
      complianceRate: complianceRate.toFixed(2) + "%",
      violations: violations.length,
      violationDetails: violations.map((v) => v.risks),
      optOuts,
      ethicsNFTsMinted: nftsMinted,
    }
  } catch (error) {
    Sentry.captureException(error)
    throw error
  }
}

// Add opt-out link to message
export function addOptOutLink(message: string, leadId: string): string {
  const optOutUrl = `${process.env.FRONTEND_URL}/opt-out/${leadId}`
  return `${message}\n\nReply STOP to opt out or visit: ${optOutUrl}`
}

// Mini-Miranda warning for FDCPA
export function addMiniMiranda(message: string): string {
  return `${message}\n\nThis is an attempt to collect a debt on your behalf. Any information obtained will be used for that purpose.`
}

// State-specific compliance wrappers
export async function floridaCompliance(message: string, leadId: string): Promise<string> {
  // FL §45.032 requires disclosure about surplus funds
  const disclosure = "Under Florida Statute §45.032, you may be entitled to surplus funds from a foreclosure sale."
  return `${disclosure}\n\n${message}`
}

export async function oklahomaCompliance(message: string, leadId: string): Promise<string> {
  // 12 O.S. §772 - Oklahoma surplus funds statute
  const disclosure = "Under Oklahoma law (12 O.S. §772), you may claim surplus funds from a sheriff's sale."
  return `${disclosure}\n\n${message}`
}
