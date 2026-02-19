"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as Sentry from "@sentry/nextjs"

async function sendSMSInternal(phone: string, message: string, leadId?: string) {
  return Sentry.startSpan({ op: "sms.send", name: "sendSMS" }, async (span) => {
    try {
      const { userId } = await auth()
      if (!userId) throw new Error("Unauthorized")

      span.setAttribute("phone", phone)
      if (leadId) span.setAttribute("lead_id", leadId)

      // Verify lead belongs to user if leadId provided
      if (leadId) {
        const lead = await prisma.lead.findFirst({
          where: { id: leadId, userId },
        })
        if (!lead) throw new Error("Lead not found")
      }

      // TODO: Integrate with SMS provider (Twilio, etc)
      // For now, just log the communication
      const communication = leadId
        ? await prisma.communication.create({
            data: {
              leadId,
              type: "sms",
              direction: "outbound",
              content: message,
              phone,
              status: "sent",
            },
          })
        : null

      if (leadId) {
        revalidatePath(`/dashboard/leads/${leadId}`)
      }

      return { success: true, communication, phone, message }
    } catch (error) {
      Sentry.captureException(error)
      return { success: false, error: String(error) }
    }
  })
}

async function makeCallInternal(leadId: string, phone: string) {
  return Sentry.startSpan({ op: "call.initiate", name: "makeCall" }, async (span) => {
    try {
      const { userId } = await auth()
      if (!userId) throw new Error("Unauthorized")

      span.setAttribute("lead_id", leadId)
      span.setAttribute("phone", phone)

      // Verify lead belongs to user
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, userId },
      })
      if (!lead) throw new Error("Lead not found")

      // TODO: Integrate with call provider (Twilio, etc)
      const communication = await prisma.communication.create({
        data: {
          leadId,
          type: "CALL",
          direction: "OUTBOUND",
          phone,
          status: "INITIATED",
        },
      })

      revalidatePath(`/dashboard/leads/${leadId}`)
      return { success: true, communication }
    } catch (error) {
      Sentry.captureException(error)
      return { success: false, error: String(error) }
    }
  })
}

async function getMessageHistoryInternal(leadId: string) {
  return Sentry.startSpan({ op: "db.query", name: "getMessageHistory" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) throw new Error("Unauthorized")

      // Verify lead belongs to user
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, userId },
      })
      if (!lead) throw new Error("Lead not found")

      const communications = await prisma.communication.findMany({
        where: { leadId },
        orderBy: { createdAt: "desc" },
      })

      return { success: true, communications }
    } catch (error) {
      Sentry.captureException(error)
      return { success: false, error: String(error) }
    }
  })
}

// Explicit named exports
export const sendSMS = sendSMSInternal
export const makeCall = makeCallInternal
export const getMessageHistory = getMessageHistoryInternal

// Additional named exports for compatibility
export { sendSMSInternal as sendMessage }
