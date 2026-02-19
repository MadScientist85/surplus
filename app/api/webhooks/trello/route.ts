import { type NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { prisma } from "@/lib/prisma"
import { mcpExecute } from "@/lib/ai/mcp-tool-calling"

export async function POST(req: NextRequest) {
  const span = Sentry.startSpan({ name: "webhook.trello" })

  try {
    const payload = await req.json()

    // Handle card moved events
    if (payload.action?.type === "updateCard" && payload.action?.data?.listAfter) {
      const cardId = payload.action.data.card.id
      const listName = payload.action.data.listAfter.name

      // Find lead by Trello card ID
      const lead = await prisma.lead.findFirst({
        where: { trelloCardId: cardId },
      })

      if (lead) {
        // Map Trello list to lead status
        const statusMap: Record<string, string> = {
          "High Priority": "contacted",
          "In Progress": "filing",
          Filed: "filed",
          Approved: "approved",
          Paid: "completed",
        }

        const newStatus = statusMap[listName]

        if (newStatus) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { status: newStatus },
          })

          // Trigger AI automation based on status
          if (newStatus === "approved") {
            await mcpExecute(`Claim ${lead.id} approved in Trello. Disburse funds and mint NFT.`, { leadId: lead.id })
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  } finally {
    span?.end()
  }
}
