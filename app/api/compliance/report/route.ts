import { NextResponse } from "next/server"
import { generateComplianceReport } from "@/lib/compliance/fortress"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "30")

    const report = await generateComplianceReport(days)

    return NextResponse.json(report)
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate compliance report" }, { status: 500 })
  }
}
