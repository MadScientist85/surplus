import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Handle STOP messages from Twilio
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { From, Body } = body

    // Check if message is STOP
    const stopKeywords = ["stop", "unsubscribe", "cancel", "end", "quit"]
    const isStop = stopKeywords.some((keyword) => Body.toLowerCase().includes(keyword))

    if (isStop) {
      // Find lead by phone
      const lead = await prisma.lead.findFirst({
        where: {
          OR: [{ phone: From }, { phones: { has: From } }],
        },
      })

      if (lead) {
        // Mark as opted out
        await prisma.lead.update({
          where: { id: lead.id },
          data: { optedOut: true },
        })

        // Log opt-out
        await prisma.optOut.create({
          data: {
            phone: From,
            leadId: lead.id,
            method: "sms_stop",
          },
        })
      }

      return NextResponse.json({
        success: true,
        message: "Opt-out processed",
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] STOP handler error:", error)
    return NextResponse.json({ error: "Failed to process STOP" }, { status: 500 })
  }
}
