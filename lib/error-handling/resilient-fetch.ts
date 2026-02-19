import * as Sentry from "@sentry/nextjs"
import { withRetry, CircuitBreaker } from "./impenetrable-vault"

const circuitBreakers = new Map<string, CircuitBreaker>()

function getCircuitBreaker(key: string): CircuitBreaker {
  if (!circuitBreakers.has(key)) {
    circuitBreakers.set(key, new CircuitBreaker())
  }
  return circuitBreakers.get(key)!
}

export interface ResilientFetchOptions extends RequestInit {
  timeout?: number
  retries?: number
  circuitBreakerKey?: string
}

export async function resilientFetch(url: string, options: ResilientFetchOptions = {}): Promise<Response> {
  const { timeout = 30000, retries = 3, circuitBreakerKey, ...fetchOptions } = options

  return Sentry.startSpan(
    {
      op: "http.client",
      name: `Resilient Fetch: ${url}`,
    },
    async (span) => {
      span.setAttribute("url", url)
      span.setAttribute("timeout", timeout)
      span.setAttribute("retries", retries)

      const fetchWithTimeout = async (): Promise<Response> => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        try {
          const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          return response
        } finally {
          clearTimeout(timeoutId)
        }
      }

      const executeWithCircuitBreaker = async () => {
        if (circuitBreakerKey) {
          const breaker = getCircuitBreaker(circuitBreakerKey)
          return breaker.execute(fetchWithTimeout)
        }
        return fetchWithTimeout()
      }

      try {
        return await withRetry(executeWithCircuitBreaker, {
          maxRetries: retries,
        })
      } catch (error) {
        Sentry.captureException(error, {
          extra: { url, options },
        })
        throw error
      }
    },
  )
}

export function getCircuitBreakerStatus(key: string) {
  return circuitBreakers.get(key)?.getState()
}

export function getAllCircuitBreakers() {
  const status: Record<string, any> = {}
  for (const [key, breaker] of circuitBreakers.entries()) {
    status[key] = breaker.getState()
  }
  return status
}
