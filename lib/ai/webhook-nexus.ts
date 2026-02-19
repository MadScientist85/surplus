"use server"

import * as Sentry from "@sentry/nextjs"
import { prisma } from "@/lib/prisma"
import { mcpExecute } from "./mcp-tool-calling"

// Webhook event types
export type WebhookEvent = {
  type: "twilio_stop" | "docusign_signed" | "clerk_update" | "polygon_bounty"
  data: any
  timestamp: Date
}

// Process incoming webhook and trigger AI reaction
export async function processWebhook(event: WebhookEvent) {
  return await Sentry.startSpan({ op: "webhook", name: `Webhook: ${event.type}` }, async () => {
    try {
      // Log webhook event
      await prisma.webhookEvent.create({
        data: {
          type: event.type,
          payload: event.data,
          processedAt: new Date(),
        },
      })

      let aiPrompt = ""
      let context: any = {}

      switch (event.type) {
        case "twilio_stop":
          aiPrompt = `User ${event.data.from} sent STOP. Opt them out immediately and pause all outreach. Log this for compliance.`
          context = { phone: event.data.from }
          break

        case "docusign_signed":
          aiPrompt = `DocuSign contract ${event.data.envelopeId} was signed. Auto-file the claim with the county clerk and prepare bounty payment.`
          context = { envelopeId: event.data.envelopeId }
          break

        case "clerk_update":
          aiPrompt = `County clerk updated case ${event.data.caseNumber} to status: ${event.data.status}. If approved, disburse funds and mint ethics NFT.`
          context = { caseNumber: event.data.caseNumber }
          break

        case "polygon_bounty":
          aiPrompt = `Bounty payment of ${event.data.amount} completed for referrer ${event.data.referrerId}. Update affiliate dashboard and send notification.`
          context = { referrerId: event.data.referrerId }
          break
      }

      // Execute AI reaction
      const result = await mcpExecute(aiPrompt, context)

      return {
        success: true,
        event: event.type,
        ai_response: result.final_answer,
        tools_executed: result.tools_executed,
      }
    } catch (error) {
      Sentry.captureException(error)
      throw error
    }
  })
}

// Real-time event stream for UI
export async function getRecentWebhooks(limit = 20) {
  return await prisma.webhookEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  })
}
