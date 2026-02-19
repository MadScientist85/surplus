"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as Sentry from "@sentry/nextjs"

export async function createLead(data: {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  claimAmount: number
  state: string
  propertyAddress?: string
  notes?: string
}) {
  return Sentry.startSpan({ op: "db.create", name: "createLead" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) throw new Error("Unauthorized")

      const lead = await prisma.lead.create({
        data: {
          ...data,
          status: "NEW",
          userId,
        },
      })

      revalidatePath("/dashboard")
      return { success: true, lead }
    } catch (error) {
      Sentry.captureException(error)
      return { success: false, error: String(error) }
    }
  })
}

export async function getLeads() {
  return Sentry.startSpan({ op: "db.query", name: "getLeads" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) throw new Error("Unauthorized")

      const leads = await prisma.lead.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          notes: { orderBy: { createdAt: "desc" }, take: 3 },
          communications: { orderBy: { createdAt: "desc" }, take: 3 },
        },
      })

      return { success: true, leads }
    } catch (error) {
      Sentry.captureException(error)
      return { success: false, error: String(error) }
    }
  })
}

export async function getLead(leadId: string) {
  return Sentry.startSpan({ op: "db.query", name: "getLead" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) throw new Error("Unauthorized")

      const lead = await prisma.lead.findFirst({
        where: { id: leadId, userId },
        include: {
          notes: { orderBy: { createdAt: "desc" } },
          communications: { orderBy: { createdAt: "desc" } },
          documents: { orderBy: { createdAt: "desc" } },
          skipTracingResults: { orderBy: { createdAt: "desc" } },
          filingStatuses: { orderBy: { createdAt: "desc" } },
        },
      })

      if (!lead) throw new Error("Lead not found")

      return { success: true, lead }
    } catch (error) {
      Sentry.captureException(error)
      return { success: false, error: String(error) }
    }
  })
}

export async function updateLeadStatus(leadId: string, status: string) {
  return Sentry.startSpan({ op: "db.update", name: "updateLeadStatus" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) throw new Error("Unauthorized")

      const lead = await prisma.lead.updateMany({
        where: { id: leadId, userId },
        data: { status },
      })

      revalidatePath("/dashboard")
      return { success: true, lead }
    } catch (error) {
      Sentry.captureException(error)
      return { success: false, error: String(error) }
    }
  })
}

export async function addNote(leadId: string, content: string) {
  return Sentry.startSpan({ op: "db.create", name: "addNote" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) throw new Error("Unauthorized")

      // Verify lead belongs to user
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, userId },
      })
      if (!lead) throw new Error("Lead not found")

      const note = await prisma.note.create({
        data: {
          leadId,
          content,
        },
      })

      revalidatePath(`/dashboard/leads/${leadId}`)
      return { success: true, note }
    } catch (error) {
      Sentry.captureException(error)
      return { success: false, error: String(error) }
    }
  })
}
