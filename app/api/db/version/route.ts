import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const result = await sql`SELECT version()`

    return NextResponse.json({
      success: true,
      version: result[0].version,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Database error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect to database",
      },
      { status: 500 },
    )
  }
}
