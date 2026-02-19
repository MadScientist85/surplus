import type { NextRequest } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { mcpExecute } from "@/lib/ai/mcp-tool-calling"
import * as Sentry from "@sentry/nextjs"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { prompt, context } = await req.json()

    const result = await mcpExecute(prompt, { userId, ...context })

    return Response.json(result)
  } catch (error) {
    Sentry.captureException(error)
    return Response.json({ error: (error as Error).message }, { status: 500 })
  }
}
