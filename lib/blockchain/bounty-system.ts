import * as Sentry from "@sentry/nextjs"
import { prisma } from "@/lib/prisma"

export interface BountyConfig {
  minAmount: number
  maxAmount: number
  percentOfClaim: number
}

export interface BountyPayment {
  leadId: string
  referrerId: string
  claimAmount: number
  bountyAmount: number
  txHash?: string
}

const DEFAULT_BOUNTY_CONFIG: BountyConfig = {
  minAmount: 50,
  maxAmount: 500,
  percentOfClaim: 0.05, // 5%
}

export async function calculateBounty(claimAmount: number): Promise<number> {
  const config = DEFAULT_BOUNTY_CONFIG
  const calculatedBounty = claimAmount * config.percentOfClaim

  // Apply min/max bounds
  return Math.max(config.minAmount, Math.min(config.maxAmount, calculatedBounty))
}

export async function createBounty(payment: BountyPayment): Promise<string> {
  return Sentry.startSpan({ op: "blockchain.bounty", name: "Create Bounty Payment" }, async (span) => {
    span.setAttribute("lead_id", payment.leadId)
    span.setAttribute("bounty_amount", payment.bountyAmount)
    span.setAttribute("referrer_id", payment.referrerId)

    try {
      // Create bounty record in database
      const bounty = await prisma.bounty.create({
        data: {
          leadId: payment.leadId,
          referrerId: payment.referrerId,
          amount: payment.bountyAmount,
          status: "pending",
        },
      })

      // Process payment on Polygon
      const txHash = await processBountyPayment(payment)

      // Update bounty with transaction hash
      await prisma.bounty.update({
        where: { id: bounty.id },
        data: {
          txHash,
          status: "paid",
          paidAt: new Date(),
        },
      })

      const { logger } = Sentry
      logger.info("Bounty created and paid", {
        bounty_id: bounty.id,
        tx_hash: txHash,
        amount: payment.bountyAmount,
      })

      return txHash
    } catch (error) {
      Sentry.captureException(error)
      throw error
    }
  })
}

async function processBountyPayment(payment: BountyPayment): Promise<string> {
  // Process bounty payment on Polygon network
  const contractAddress = process.env.BOUNTY_CONTRACT_ADDRESS
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY

  if (!contractAddress || !privateKey) {
    throw new Error("Bounty payment credentials not configured")
  }

  // In production, use ethers.js to send payment
  // For now, return mock transaction
  const mockTxHash = `0x${Math.random().toString(16).slice(2)}${payment.leadId.slice(0, 8)}`

  // Simulated blockchain confirmation delay
  await new Promise((resolve) => setTimeout(resolve, 3000))

  return mockTxHash
}

export async function getBountyHistory(referrerId: string) {
  return Sentry.startSpan({ op: "db.query", name: "Get Bounty History" }, async (span) => {
    span.setAttribute("referrer_id", referrerId)

    const bounties = await prisma.bounty.findMany({
      where: { referrerId },
      orderBy: { createdAt: "desc" },
      include: {
        lead: {
          select: {
            name: true,
            state: true,
            claimAmount: true,
          },
        },
      },
    })

    const totalEarned = bounties.filter((b) => b.status === "paid").reduce((sum, b) => sum + b.amount, 0)

    const pendingAmount = bounties.filter((b) => b.status === "pending").reduce((sum, b) => sum + b.amount, 0)

    return {
      bounties,
      stats: {
        totalEarned,
        pendingAmount,
        count: bounties.length,
      },
    }
  })
}

export async function claimBounty(bountyId: string, walletAddress: string) {
  return Sentry.startSpan({ op: "blockchain.claim", name: "Claim Bounty" }, async (span) => {
    span.setAttribute("bounty_id", bountyId)
    span.setAttribute("wallet", walletAddress)

    try {
      const bounty = await prisma.bounty.findUnique({
        where: { id: bountyId },
      })

      if (!bounty) {
        throw new Error("Bounty not found")
      }

      if (bounty.status !== "pending") {
        throw new Error("Bounty already claimed or invalid")
      }

      // Process claim transaction
      const txHash = await processClaimTransaction(bounty, walletAddress)

      // Update bounty status
      await prisma.bounty.update({
        where: { id: bountyId },
        data: {
          status: "claimed",
          txHash,
          claimedAt: new Date(),
        },
      })

      return txHash
    } catch (error) {
      Sentry.captureException(error)
      throw error
    }
  })
}

async function processClaimTransaction(bounty: any, walletAddress: string): Promise<string> {
  // Process claim on blockchain
  const mockTxHash = `0x${Math.random().toString(16).slice(2)}${bounty.id.slice(0, 8)}`
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return mockTxHash
}
