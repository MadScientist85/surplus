import { generateText } from "ai"
import * as Sentry from "@sentry/nextjs"
import { searchKnowledgeBase } from "./supabase-kb"

export interface ParalegalQuery {
  question: string
  state?: string
  leadId?: string
  context?: string
}

export interface ParalegalResponse {
  answer: string
  confidence: number
  sources: string[]
  relatedQuestions: string[]
}

export async function askAIParalegal(query: ParalegalQuery): Promise<ParalegalResponse> {
  return Sentry.startSpan({ op: "ai.query", name: "AI Paralegal Query" }, async (span) => {
    span.setAttribute("question", query.question)
    span.setAttribute("state", query.state || "none")

    try {
      // Search knowledge base first
      const kbResults = await searchKnowledgeBase(query.question, undefined, query.state)

      // Build context from knowledge base
      const kbContext = kbResults
        .map((entry) => `Q: ${entry.question}\nA: ${entry.answer}\nSources: ${entry.sources.join(", ")}`)
        .join("\n\n")

      // Build comprehensive prompt
      const systemPrompt = `You are an expert AI paralegal specializing in unclaimed property and asset recovery law. 
You have deep knowledge of all 50 state statutes, filing procedures, and compliance requirements.

Your role:
- Provide accurate legal guidance on unclaimed property recovery
- Reference specific state laws and statutes when applicable
- Explain filing procedures step-by-step
- Highlight compliance requirements and deadlines
- Suggest best practices for ethical recovery

Always cite your sources and indicate confidence level in your answers.`

      const userPrompt = `Question: ${query.question}

${query.state ? `State Context: ${query.state}` : ""}
${query.context ? `Additional Context: ${query.context}` : ""}

${kbContext ? `Knowledge Base Context:\n${kbContext}` : ""}

Please provide a comprehensive answer with:
1. Direct answer to the question
2. Relevant state-specific information (if applicable)
3. Procedural steps (if applicable)
4. Compliance considerations
5. Sources/citations`

      const { text } = await generateText({
        model: "xai/grok-beta",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        maxTokens: 1500,
      })

      // Extract sources from response
      const sources = extractSources(text)

      // Calculate confidence based on KB results and response clarity
      const confidence = calculateConfidence(kbResults.length, text)

      // Generate related questions
      const relatedQuestions = await generateRelatedQuestions(query.question, query.state)

      const { logger } = Sentry
      logger.info("AI Paralegal query completed", {
        question: query.question,
        confidence,
        sources_count: sources.length,
      })

      return {
        answer: text,
        confidence,
        sources,
        relatedQuestions,
      }
    } catch (error) {
      Sentry.captureException(error)
      throw error
    }
  })
}

function extractSources(text: string): string[] {
  const sourcePatterns = [
    /\[([^\]]+)\]/g, // [Source text]
    /Source:?\s*([^\n]+)/gi, // Source: text
    /§\s*[\d.-]+/g, // § 123.45 statute references
    /\d+\s+U\.S\.C\.\s*§\s*\d+/g, // Federal code references
  ]

  const sources: string[] = []

  for (const pattern of sourcePatterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      sources.push(match[1] || match[0])
    }
  }

  return [...new Set(sources)] // Remove duplicates
}

function calculateConfidence(kbResultsCount: number, responseText: string): number {
  let confidence = 0.5 // Base confidence

  // Increase confidence based on KB matches
  confidence += Math.min(kbResultsCount * 0.1, 0.3)

  // Increase confidence if response contains citations
  if (responseText.includes("§") || responseText.includes("U.S.C")) {
    confidence += 0.1
  }

  // Increase confidence if response is detailed (longer responses)
  if (responseText.length > 500) {
    confidence += 0.1
  }

  return Math.min(confidence, 1.0)
}

async function generateRelatedQuestions(question: string, state?: string): Promise<string[]> {
  try {
    const prompt = `Given this question about unclaimed property recovery: "${question}"
${state ? `In the context of ${state} state law,` : ""}

Generate 3 related follow-up questions that a user might ask next. Return only the questions, one per line.`

    const { text } = await generateText({
      model: "xai/grok-beta",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      maxTokens: 200,
    })

    return text
      .split("\n")
      .filter((q) => q.trim().length > 0)
      .slice(0, 3)
  } catch (error) {
    Sentry.captureException(error)
    return []
  }
}

export async function selfAudit(leadId: string) {
  return Sentry.startSpan({ op: "ai.audit", name: "Self Audit Lead" }, async (span) => {
    span.setAttribute("lead_id", leadId)

    const auditQuestions = [
      "Has this lead been properly verified for compliance?",
      "Are all required documents present and accurate?",
      "Has DNC scrubbing been completed?",
      "Is the recovery amount calculation correct?",
      "Have all ethical considerations been addressed?",
    ]

    const auditResults = []

    for (const question of auditQuestions) {
      const response = await askAIParalegal({
        question,
        leadId,
        context: `Performing self-audit for lead ${leadId}`,
      })

      auditResults.push({
        question,
        result: response.answer,
        confidence: response.confidence,
      })
    }

    const overallConfidence = auditResults.reduce((sum, r) => sum + r.confidence, 0) / auditResults.length

    return {
      leadId,
      auditResults,
      overallConfidence,
      passed: overallConfidence >= 0.8,
      timestamp: new Date().toISOString(),
    }
  })
}
