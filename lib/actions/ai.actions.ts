"use server"

import { auth } from "@clerk/nextjs/server"
import { generateText } from "ai"
import * as Sentry from "@sentry/nextjs"

export async function generateAIResponse(prompt: string, context?: any) {
  return Sentry.startSpan({ op: "ai.generate", name: "generateAIResponse" }, async (span) => {
    try {
      const { userId } = await auth()
      if (!userId) throw new Error("Unauthorized")

      span.setAttribute("prompt_length", prompt.length)
      span.setAttribute("has_context", !!context)

      const { text } = await generateText({
        model: "xai/grok-beta",
        prompt: context ? `Context: ${JSON.stringify(context)}\n\nQuery: ${prompt}` : prompt,
      })

      span.setAttribute("response_length", text.length)

      return { success: true, text }
    } catch (error) {
      Sentry.captureException(error)
      return { success: false, error: String(error) }
    }
  })
}
