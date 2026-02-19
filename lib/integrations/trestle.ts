import * as Sentry from "@sentry/nextjs"
import { resilientFetch } from "../error-handling/resilient-fetch"

interface TrestleProperty {
  address: string
  owner: string
  value: number
  yearBuilt: number
  sqft: number
  beds: number
  baths: number
}

export async function trestlePropertySearch(address: string): Promise<TrestleProperty | null> {
  const span = Sentry.startSpan({ name: "trestle.propertySearch" })

  try {
    const response = await resilientFetch("https://api.trestle.com/properties", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TRESTLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address }),
    })

    const data = await response.json()
    return data.property || null
  } catch (error) {
    Sentry.captureException(error)
    return null
  } finally {
    span?.end()
  }
}
