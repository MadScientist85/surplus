import * as Sentry from "@sentry/nextjs"

const { logger } = Sentry

export class SkipForce {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.SKIPFORCE_API_KEY || ""
    this.baseUrl = "https://api.skipforce.com/v1"
  }

  async trace(lead: any): Promise<any> {
    return Sentry.startSpan(
      {
        op: "skiptrace.skipforce",
        name: "SkipForce Trace",
      },
      async () => {
        try {
          logger.debug("SkipForce trace initiated", { leadId: lead.id })

          const response = {
            phone: null,
            email: null,
            mailingAddress: null,
          }

          return response
        } catch (error) {
          logger.error("SkipForce trace failed", {
            error: error instanceof Error ? error.message : "Unknown error",
          })

          throw error
        }
      },
    )
  }
}
