import * as Sentry from "@sentry/nextjs"
import { prisma } from "@/lib/prisma"
import { skipTraceLead } from "@/lib/skiptrace/cascade"
import { autoFileClaim } from "@/lib/filing/paperwork-bot"
import { sendSMS } from "@/lib/actions"
import { mintEthicsNFT } from "@/lib/blockchain/nft-mint"
import { scrubDNC } from "@/lib/skiptrace/dnc-scrub-nexus"
import { generateText } from "ai"
import { complianceCheck, addOptOutLink, getComplianceScore } from "@/lib/compliance/fortress"

// Tool definitions for MCP
const TOOLS = [
  {
    name: "skip_trace",
    description: "Enrich lead with phones, emails, and relatives using cascade fallback",
    parameters: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "Lead ID to skip trace" },
        name: { type: "string", description: "Person's full name" },
        address: { type: "string", description: "Property address" },
      },
      required: ["leadId"],
    },
  },
  {
    name: "file_claim",
    description: "Auto-file surplus claim form with county clerk",
    parameters: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "Lead ID to file claim for" },
        state: { type: "string", description: "State code (FL, CA, OK, etc.)" },
      },
      required: ["leadId", "state"],
    },
  },
  {
    name: "send_sms",
    description: "Send TCPA-compliant SMS message",
    parameters: {
      type: "object",
      properties: {
        phone: { type: "string", description: "Phone number to send to" },
        message: { type: "string", description: "Message content" },
        leadId: { type: "string", description: "Associated lead ID" },
      },
      required: ["phone", "message"],
    },
  },
  {
    name: "generate_nft",
    description: "Mint ethics guarantee NFT on Polygon",
    parameters: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "Lead ID for NFT" },
        metadata: { type: "object", description: "NFT metadata" },
      },
      required: ["leadId"],
    },
  },
  {
    name: "check_dnc",
    description: "Scrub phone number against DoNotCall.gov registry",
    parameters: {
      type: "object",
      properties: {
        phone: { type: "string", description: "Phone number to check" },
      },
      required: ["phone"],
    },
  },
  {
    name: "get_lead_status",
    description: "Get current status and details of a lead",
    parameters: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "Lead ID to query" },
      },
      required: ["leadId"],
    },
  },
  {
    name: "compliance_check",
    description: "Check TCPA/FDCPA/State law compliance before outreach",
    parameters: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "Lead ID to check" },
        action: { type: "string", enum: ["sms", "email", "call"], description: "Type of outreach" },
        phone: { type: "string", description: "Phone number (optional)" },
      },
      required: ["leadId", "action"],
    },
  },
  {
    name: "get_compliance_score",
    description: "Get compliance risk score (0-100) for a lead",
    parameters: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "Lead ID to score" },
      },
      required: ["leadId"],
    },
  },
  {
    name: "honor_optout",
    description: "Mark lead as opted out and block future contact",
    parameters: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "Lead ID to opt out" },
        phone: { type: "string", description: "Phone number that opted out" },
      },
      required: ["leadId"],
    },
  },
]

// MCP Execute - Unified tool calling across AI providers
export async function mcpExecute(userPrompt: string, context?: { userId?: string; leadId?: string }) {
  return await Sentry.startSpan({ op: "ai.mcp", name: "MCP Tool Execute" }, async () => {
    try {
      // Use Grok for tool calling with reasoning
      const response = await generateText({
        model: "xai/grok-2-1212",
        prompt: userPrompt,
        tools: TOOLS.reduce((acc, tool) => {
          acc[tool.name] = {
            description: tool.description,
            parameters: tool.parameters,
          }
          return acc
        }, {} as any),
        toolChoice: "auto",
        maxSteps: 5, // Allow multi-step tool execution
      })

      // Execute tools if called
      const toolResults = []
      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          const result = await executeTool(toolCall.toolName, toolCall.args, context)
          toolResults.push({
            tool: toolCall.toolName,
            args: toolCall.args,
            result,
          })

          // Log tool execution
          await prisma.toolExecution.create({
            data: {
              toolName: toolCall.toolName,
              args: toolCall.args,
              result,
              userId: context?.userId || "system",
              prompt: userPrompt,
              success: result.success !== false,
            },
          })
        }
      }

      return {
        tools_executed: toolResults,
        final_answer: response.text,
        steps: response.steps || [],
      }
    } catch (error) {
      Sentry.captureException(error)
      throw error
    }
  })
}

// Execute individual tool
async function executeTool(name: string, args: any, context?: { userId?: string }) {
  try {
    switch (name) {
      case "skip_trace":
        return await skipTraceLead(args.leadId)

      case "file_claim":
        return await autoFileClaim(args.leadId, args.state)

      case "send_sms":
        if (args.leadId) {
          const compliance = await complianceCheck(args.leadId, "sms", args.phone)
          if (!compliance.compliant) {
            return {
              success: false,
              blocked: true,
              violations: compliance.violations,
              message: `COMPLIANCE BLOCK: ${compliance.violations.join(", ")}`,
            }
          }
          // Add opt-out link
          args.message = addOptOutLink(args.message, args.leadId)
        }
        return await sendSMS(args.phone, args.message, args.leadId)

      case "generate_nft":
        return await mintEthicsNFT(args.leadId, args.metadata)

      case "check_dnc":
        const dncResults = await scrubDNC([args.phone])
        return { clean: !dncResults[args.phone], phone: args.phone }

      case "get_lead_status":
        const lead = await prisma.lead.findUnique({
          where: { id: args.leadId },
          include: {
            notes: true,
            communications: { orderBy: { createdAt: "desc" }, take: 5 },
          },
        })
        return { lead }

      case "compliance_check":
        return await complianceCheck(args.leadId, args.action, args.phone)

      case "get_compliance_score":
        const score = await getComplianceScore(args.leadId)
        return { leadId: args.leadId, complianceScore: score }

      case "honor_optout":
        await prisma.lead.update({
          where: { id: args.leadId },
          data: { optedOut: true },
        })
        return { success: true, message: `Lead ${args.leadId} opted out successfully` }

      default:
        throw new Error(`Tool ${name} not implemented`)
    }
  } catch (error) {
    Sentry.captureException(error)
    return { success: false, error: (error as Error).message }
  }
}

// Batch tool execution for multiple leads
export async function mcpBatchExecute(operations: Array<{ prompt: string; context?: any }>) {
  const results = []
  for (const op of operations) {
    const result = await mcpExecute(op.prompt, op.context)
    results.push(result)
  }
  return results
}
