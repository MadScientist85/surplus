import * as Sentry from "@sentry/nextjs"
import { CircuitBreaker } from "@/lib/error-handling/impenetrable-vault"
import { skipTraceLead } from "@/lib/skiptrace/cascade"
import { autoFileClaim } from "@/lib/filing/paperwork-bot"
import { sendSMS } from "@/lib/actions"
import { mintEthicsNFT } from "@/lib/blockchain/nft-mint"
import { scrubDNC } from "@/lib/skiptrace/dnc-scrub-nexus"

// API Dominion - Orchestrated external API calls with circuit breakers
export const apiDominion = {
  // Skip Tracing
  skipTrace: new CircuitBreaker(async (leadId: string) => await skipTraceLead(leadId), { name: "skipTrace" }),

  // Filing
  fileClaim: new CircuitBreaker(async (leadId: string, state: string) => await autoFileClaim(leadId, state), {
    name: "fileClaim",
  }),

  // Communications
  sendSMS: new CircuitBreaker(
    async (phone: string, message: string, leadId?: string) => await sendSMS(phone, message, leadId),
    { name: "sendSMS" },
  ),

  // Blockchain
  mintNFT: new CircuitBreaker(async (leadId: string, metadata?: any) => await mintEthicsNFT(leadId, metadata), {
    name: "mintNFT",
  }),

  // Compliance
  checkDNC: new CircuitBreaker(async (phones: string[]) => await scrubDNC(phones), { name: "checkDNC" }),
}

// Orchestrate multiple API calls with fallbacks
export async function orchestrateAPIs(
  operations: Array<{
    api: keyof typeof apiDominion
    args: any[]
    critical: boolean
  }>,
) {
  return await Sentry.startSpan({ op: "api.orchestrate", name: "API Orchestration" }, async () => {
    const results = []

    for (const op of operations) {
      try {
        const circuit = apiDominion[op.api] as any
        const result = await circuit.execute(...op.args)
        results.push({ api: op.api, success: true, result })
      } catch (error) {
        const errorMsg = (error as Error).message
        Sentry.captureException(error)

        if (op.critical) {
          throw new Error(`Critical API ${op.api} failed: ${errorMsg}`)
        }

        results.push({ api: op.api, success: false, error: errorMsg })
      }
    }

    return results
  })
}

// Get health status of all APIs
export async function getAPIHealthStatus() {
  const status: Record<string, any> = {}

  for (const [name, circuit] of Object.entries(apiDominion)) {
    status[name] = {
      state: (circuit as any).state,
      failures: (circuit as any).failures,
      lastFailure: (circuit as any).lastFailureTime,
    }
  }

  return status
}
