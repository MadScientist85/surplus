import * as Sentry from "@sentry/nextjs"
import { resilientFetch } from "../error-handling/resilient-fetch"

interface ZeroBounceResult {
  email_address: string
  status: "valid" | "invalid" | "catch-all" | "unknown" | "spamtrap" | "abuse" | "do_not_mail"
  sub_status: string
  free_email: boolean
  did_you_mean: string | null
}

export async function verifyBulkEmails(emails: string[]): Promise<string[]> {
  const span = Sentry.startSpan({ name: "zerobounce.verifyBulk" })

  try {
    const response = await resilientFetch("https://bulkapi.zerobounce.net/v2/validatebatch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.ZEROBOUNCE_API_KEY,
        email_batch: emails.map((email) => ({ email_address: email })),
      }),
    })

    const data = await response.json()
    const results: ZeroBounceResult[] = data.email_batch || []

    // Return only valid emails
    return results.filter((r) => r.status === "valid" || r.status === "catch-all").map((r) => r.email_address)
  } catch (error) {
    Sentry.captureException(error)
    return []
  } finally {
    span?.end()
  }
}

export async function verifySingleEmail(email: string): Promise<boolean> {
  const span = Sentry.startSpan({ name: "zerobounce.verifySingle" })

  try {
    const response = await resilientFetch(
      `https://api.zerobounce.net/v2/validate?api_key=${process.env.ZEROBOUNCE_API_KEY}&email=${encodeURIComponent(email)}`,
    )

    const data: ZeroBounceResult = await response.json()
    return data.status === "valid" || data.status === "catch-all"
  } catch (error) {
    Sentry.captureException(error)
    return false
  } finally {
    span?.end()
  }
}
