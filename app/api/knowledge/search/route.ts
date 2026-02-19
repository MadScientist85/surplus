import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { searchKnowledgeBase } from "@/lib/knowledge/supabase-kb"

export async function GET(req: NextRequest) {
  return Sentry.startSpan({ op: "http.server", name: "GET /api/knowledge/search" }, async () => {
    try {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const searchParams = req.nextUrl.searchParams
      const query = searchParams.get("q")
      const category = searchParams.get("category") || undefined
      const state = searchParams.get("state") || undefined

      if (!query) {
        return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
      }

      const results = await searchKnowledgeBase(query, category, state)

      return NextResponse.json({ results, count: results.length })
    } catch (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: "Failed to search knowledge base" }, { status: 500 })
    }
  })
}
