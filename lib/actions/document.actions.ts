"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { put, del } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import * as Sentry from "@sentry/nextjs"

export async function uploadDocument(leadId: string, fileName: string, fileData: string, fileType: string) {
  return Sentry.startSpan({ op: "document.upload", name: "uploadDocument" }, async (span) => {
    try {
      const { userId } = await auth()
      if (!userId) throw new Error("Unauthorized")

      span.setAttribute("lead_id", leadId)
      span.setAttribute("file_type", fileType)

      // Verify lead belongs to user
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, userId },
      })
      if (!lead) throw new Error("Lead not found")

      // Upload to Vercel Blob
      const blob = await put(fileName, Buffer.from(fileData, "base64"), {
        access: "public",
        contentType: fileType,
      })

      // Create document record
      const document = await prisma.document.create({
        data: {
          leadId,
          fileName,
          fileType,
          fileUrl: blob.url,
          fileSize: Buffer.from(fileData, "base64").length,
        },
      })

      revalidatePath(`/dashboard/leads/${leadId}`)
      return { success: true, document }
    } catch (error) {
      Sentry.captureException(error)
      return { success: false, error: String(error) }
    }
  })
}

export async function getDocuments(leadId: string) {
  return Sentry.startSpan({ op: "db.query", name: "getDocuments" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) throw new Error("Unauthorized")

      // Verify lead belongs to user
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, userId },
      })
      if (!lead) throw new Error("Lead not found")

      const documents = await prisma.document.findMany({
        where: { leadId },
        orderBy: { createdAt: "desc" },
      })

      return { success: true, documents }
    } catch (error) {
      Sentry.captureException(error)
      return { success: false, error: String(error) }
    }
  })
}

export async function deleteDocument(documentId: string) {
  return Sentry.startSpan({ op: "document.delete", name: "deleteDocument" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) throw new Error("Unauthorized")

      // Get document with lead to verify ownership
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: { lead: true },
      })

      if (!document) throw new Error("Document not found")
      if (document.lead.userId !== userId) throw new Error("Unauthorized")

      // Delete from Vercel Blob
      await del(document.fileUrl)

      // Delete from database
      await prisma.document.delete({
        where: { id: documentId },
      })

      revalidatePath(`/dashboard/leads/${document.leadId}`)
      return { success: true }
    } catch (error) {
      Sentry.captureException(error)
      return { success: false, error: String(error) }
    }
  })
}
