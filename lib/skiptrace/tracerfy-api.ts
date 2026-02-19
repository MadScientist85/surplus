import * as Sentry from "@sentry/nextjs"

const { logger } = Sentry

export class TracerfyApi {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.TRACERFY_API_KEY || ""
    this.baseUrl = "https://api.tracerfy.com/v1"
  }

  async trace(lead: any): Promise<any> {
    return Sentry.startSpan(
      {
        op: "skiptrace.tracerfy",
        name: "Tracerfy Trace",
      },
      async () => {
        try {
          logger.debug("Tracerfy trace initiated", { leadId: lead.id })

          const response = {
            phone: null,
            email: null,
            mailingAddress: null,
          }

          return response
        } catch (error) {
          logger.error("Tracerfy trace failed", {
            error: error instanceof Error ? error.message : "Unknown error",
          })

          throw error
        }
      },
    )
  }
}
