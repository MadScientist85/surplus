import * as Sentry from "@sentry/nextjs"
import { resilientFetch } from "../error-handling/resilient-fetch"

interface EndatoResponse {
  person: {
    phones: Array<{ number: string; type: string }>
    emails: Array<{ address: string; type: string }>
    addresses: Array<{ full: string; city: string; state: string }>
    relatives: Array<{ name: string; relation: string }>
  }
}

export async function endatoEnrich(lead: {
  name: string
  address?: string
  city?: string
  state?: string
}): Promise<{
  phones: string[]
  emails: string[]
  relatives: string[]
  addresses: string[]
}> {
  const span = Sentry.startSpan({ name: "endato.enrich" })

  try {
    const response = await resilientFetch("https://api.endato.com/v3/person", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.ENDATO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: lead.name,
        address: lead.address,
        city: lead.city,
        state: lead.state,
      }),
    })

    const data: EndatoResponse = await response.json()

    return {
      phones: data.person.phones.map((p) => p.number),
      emails: data.person.emails.map((e) => e.address),
      relatives: data.person.relatives.map((r) => r.name),
      addresses: data.person.addresses.map((a) => a.full),
    }
  } catch (error) {
    Sentry.captureException(error)
    return { phones: [], emails: [], relatives: [], addresses: [] }
  } finally {
    span?.end()
  }
}
