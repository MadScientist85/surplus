import * as Sentry from "@sentry/nextjs"

export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: "closed" | "open" | "half-open" = "closed"

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000, // 1 minute
    private readonly resetTimeout: number = 30000, // 30 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = "half-open"
        Sentry.logger.info("Circuit breaker entering half-open state")
      } else {
        throw new Error("Circuit breaker is open")
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0
    if (this.state === "half-open") {
      this.state = "closed"
      Sentry.logger.info("Circuit breaker closed")
    }
  }

  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.threshold) {
      this.state = "open"
      Sentry.logger.error("Circuit breaker opened", {
        failures: this.failures,
        threshold: this.threshold,
      })
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    }
  }
}

export class RateLimiter {
  private requests: number[] = []

  constructor(
    private readonly maxRequests: number = 100,
    private readonly windowMs: number = 60000, // 1 minute
  ) {}

  async checkLimit(identifier: string): Promise<boolean> {
    const now = Date.now()

    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => now - time < this.windowMs)

    if (this.requests.length >= this.maxRequests) {
      Sentry.logger.warn("Rate limit exceeded", {
        identifier,
        requests: this.requests.length,
        max: this.maxRequests,
      })
      return false
    }

    this.requests.push(now)
    return true
  }

  getStatus() {
    const now = Date.now()
    const activeRequests = this.requests.filter((time) => now - time < this.windowMs)
    return {
      requests: activeRequests.length,
      maxRequests: this.maxRequests,
      remaining: this.maxRequests - activeRequests.length,
    }
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    backoffMultiplier?: number
  } = {},
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000, backoffMultiplier = 2 } = options

  let lastError: Error | null = null
  let delay = initialDelay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        Sentry.captureException(error, {
          extra: {
            maxRetries,
            attempt,
          },
        })
        break
      }

      Sentry.logger.warn("Retry attempt failed", {
        attempt: attempt + 1,
        maxRetries,
        nextDelay: delay,
        error: lastError.message,
      })

      await new Promise((resolve) => setTimeout(resolve, delay))
      delay = Math.min(delay * backoffMultiplier, maxDelay)
    }
  }

  throw lastError
}
