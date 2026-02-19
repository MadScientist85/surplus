import * as Sentry from "@sentry/nextjs"
import { resilientFetch } from "../error-handling/resilient-fetch"
import { prisma } from "../prisma"

interface TrelloCard {
  id: string
  name: string
  desc: string
  idList: string
  url: string
}

interface TrelloList {
  id: string
  name: string
}

const TRELLO_API_BASE = "https://api.trello.com/1"
const API_KEY = process.env.TRELLO_API_KEY
const TOKEN = process.env.TRELLO_TOKEN
const BOARD_ID = process.env.TRELLO_BOARD_ID

export async function getTrelloLists(): Promise<TrelloList[]> {
  const span = Sentry.startSpan({ name: "trello.getLists" })

  try {
    const response = await resilientFetch(`${TRELLO_API_BASE}/boards/${BOARD_ID}/lists?key=${API_KEY}&token=${TOKEN}`)

    const lists = await response.json()
    return lists
  } catch (error) {
    Sentry.captureException(error)
    throw error
  } finally {
    span?.end()
  }
}

export async function createTrelloCard(lead: {
  id: string
  name: string
  surplusEstimate: number
  county: string
  state: string
  phones?: string[]
  emails?: string[]
  priority?: "high" | "medium" | "low"
  enrichmentSource?: string
}): Promise<TrelloCard> {
  const span = Sentry.startSpan({ name: "trello.createCard" })

  try {
    const lists = await getTrelloLists()

    // Map priority to list
    const listMap: Record<string, string> = {
      high: "High Priority",
      medium: "Medium Priority",
      low: "Backlog",
    }

    const targetListName = listMap[lead.priority || "medium"]
    const targetList = lists.find((l) => l.name === targetListName) || lists[0]

    // Create card
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    const cardData = {
      name: `${lead.name} - $${lead.surplusEstimate.toLocaleString()} (${lead.county})`,
      desc: `**Phone:** ${lead.phones?.[0] || "N/A"}\n**Email:** ${lead.emails?.[0] || "N/A"}\n**Source:** ${lead.enrichmentSource || "Unknown"}\n**Lead ID:** ${lead.id}`,
      idList: targetList.id,
      due: dueDate.toISOString(),
      key: API_KEY,
      token: TOKEN,
    }

    const response = await resilientFetch(`${TRELLO_API_BASE}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cardData),
    })

    const card = await response.json()

    // Save card ID to database
    await prisma.lead.update({
      where: { id: lead.id },
      data: { trelloCardId: card.id },
    })

    return card
  } catch (error) {
    Sentry.captureException(error)
    throw error
  } finally {
    span?.end()
  }
}

export async function moveTrelloCard(cardId: string, listName: string): Promise<void> {
  const span = Sentry.startSpan({ name: "trello.moveCard" })

  try {
    const lists = await getTrelloLists()
    const targetList = lists.find((l) => l.name === listName)

    if (!targetList) {
      throw new Error(`List "${listName}" not found`)
    }

    await resilientFetch(`${TRELLO_API_BASE}/cards/${cardId}?key=${API_KEY}&token=${TOKEN}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idList: targetList.id }),
    })
  } catch (error) {
    Sentry.captureException(error)
    throw error
  } finally {
    span?.end()
  }
}

export async function setupTrelloWebhook(): Promise<void> {
  const span = Sentry.startSpan({ name: "trello.setupWebhook" })

  try {
    const webhookData = {
      description: "HBU Claim Status Updates",
      callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/trello`,
      idModel: BOARD_ID,
      key: API_KEY,
      token: TOKEN,
    }

    await resilientFetch(`${TRELLO_API_BASE}/webhooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookData),
    })
  } catch (error) {
    Sentry.captureException(error)
    throw error
  } finally {
    span?.end()
  }
}
