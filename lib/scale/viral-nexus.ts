import * as Sentry from "@sentry/nextjs"
import { prisma } from "@/lib/prisma"

export interface AffiliateConfig {
  name: string
  email: string
  commissionRate: number
  tier: "bronze" | "silver" | "gold" | "platinum"
}

export async function createAffiliate(config: AffiliateConfig) {
  return Sentry.startSpan({ op: "scale.affiliate", name: "Create Affiliate" }, async (span) => {
    span.setAttribute("tier", config.tier)

    try {
      const affiliate = await prisma.affiliate.create({
        data: {
          name: config.name,
          email: config.email,
          commissionRate: config.commissionRate,
          tier: config.tier,
          referralCode: generateReferralCode(),
        },
      })

      const { logger } = Sentry
      logger.info("Affiliate created", {
        affiliate_id: affiliate.id,
        tier: config.tier,
      })

      return affiliate
    } catch (error) {
      Sentry.captureException(error)
      throw error
    }
  })
}

function generateReferralCode(): string {
  return `HBU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

export async function trackReferral(referralCode: string, leadId: string, claimAmount: number) {
  return Sentry.startSpan({ op: "scale.referral", name: "Track Referral" }, async (span) => {
    span.setAttribute("referral_code", referralCode)
    span.setAttribute("lead_id", leadId)

    try {
      const affiliate = await prisma.affiliate.findUnique({
        where: { referralCode },
      })

      if (!affiliate) {
        throw new Error("Invalid referral code")
      }

      const commission = claimAmount * affiliate.commissionRate

      const referral = await prisma.referral.create({
        data: {
          affiliateId: affiliate.id,
          leadId,
          claimAmount,
          commission,
        },
      })

      return referral
    } catch (error) {
      Sentry.captureException(error)
      throw error
    }
  })
}

export async function getAffiliateStats(affiliateId: string) {
  return Sentry.startSpan({ op: "db.query", name: "Get Affiliate Stats" }, async (span) => {
    span.setAttribute("affiliate_id", affiliateId)

    const referrals = await prisma.referral.findMany({
      where: { affiliateId },
      include: {
        lead: {
          select: {
            name: true,
            state: true,
            claimAmount: true,
            status: true,
          },
        },
      },
    })

    const totalCommission = referrals.reduce((sum, r) => sum + r.commission, 0)
    const totalClaims = referrals.reduce((sum, r) => sum + r.claimAmount, 0)

    return {
      totalReferrals: referrals.length,
      totalCommission,
      totalClaims,
      referrals,
    }
  })
}
