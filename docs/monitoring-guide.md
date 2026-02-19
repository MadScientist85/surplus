# Monitoring & Error Handling Guide

## Overview

The HBU Asset Recovery platform includes comprehensive monitoring, error handling, and resilience patterns to ensure 95% uptime SLA.

## Error Handling

### Circuit Breaker Pattern

The circuit breaker prevents cascading failures by temporarily blocking requests to failing services.

**States:**
- **Closed**: Normal operation, requests pass through
- **Open**: Service failing, requests blocked immediately
- **Half-Open**: Testing if service recovered

**Usage:**
```typescript
import { CircuitBreaker } from '@/lib/error-handling/impenetrable-vault'

const breaker = new CircuitBreaker(5, 60000, 30000)

try {
  const result = await breaker.execute(async () => {
    return await someRiskyOperation()
  })
} catch (error) {
  // Circuit is open or operation failed
}
```

### Resilient Fetch

Automatically retries failed requests with exponential backoff.

```typescript
import { resilientFetch } from '@/lib/error-handling/resilient-fetch'

const response = await resilientFetch('https://api.example.com/data', {
  timeout: 30000,
  retries: 3,
  circuitBreakerKey: 'external-api',
})
```

### Retry with Backoff

```typescript
import { withRetry } from '@/lib/error-handling/impenetrable-vault'

const result = await withRetry(
  async () => await unstableOperation(),
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  }
)
```

## Health Monitoring

### Health Check Endpoint

**GET /api/monitoring/health**

Returns system health status:
- 200: All systems operational
- 207: Some systems degraded
- 503: Systems down

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "checks": {
    "database": true,
    "redis": true,
    "supabase": true,
    "circuitBreakers": {}
  },
  "uptime": 3600000
}
```

### System Status

**GET /api/monitoring/status** (requires auth)

Returns detailed system metrics:

```json
{
  "status": "operational",
  "timestamp": "2025-01-15T10:30:00Z",
  "metrics": {
    "leads": {
      "total": 1250,
      "today": 45
    },
    "aru": {
      "activeRuns": 3
    },
    "filings": {
      "pending": 28
    },
    "bounties": {
      "totalPaid": 15000,
      "count": 120
    }
  }
}
```

## Sentry Integration

All operations are instrumented with Sentry for error tracking and performance monitoring.

### Exception Tracking

```typescript
try {
  await riskyOperation()
} catch (error) {
  Sentry.captureException(error, {
    extra: {
      context: 'Additional context',
      userId: user.id,
    },
  })
}
```

### Performance Spans

```typescript
const result = await Sentry.startSpan(
  {
    op: 'db.query',
    name: 'Fetch User Leads',
  },
  async (span) => {
    span.setAttribute('user_id', userId)
    return await fetchLeads(userId)
  }
)
```

### Logging

```typescript
const { logger } = Sentry

logger.info('Operation completed', { leadId, amount })
logger.warn('Rate limit approaching', { current, max })
logger.error('Payment failed', { error: error.message })
```

## CI/CD Pipeline

### GitHub Actions Workflows

1. **deploy.yml**: Automated deployment to Vercel
2. **test.yml**: Run tests on push/PR
3. **security.yml**: Weekly security scans

### Deployment Process

1. Push to main branch
2. Run linting and type checking
3. Run tests (when configured)
4. Deploy to Vercel production
5. Run health check
6. Notify team of deployment status

## Monitoring Best Practices

1. **Always use Sentry spans** for operations > 100ms
2. **Implement circuit breakers** for external APIs
3. **Use resilient fetch** for all HTTP requests
4. **Log important events** with structured data
5. **Monitor health endpoints** with uptime service
6. **Set up alerts** for critical failures
7. **Review Sentry weekly** for patterns

## SLA Targets

- **Uptime**: 95% (expected with current resilience patterns)
- **API Response Time**: < 500ms (p95)
- **Error Rate**: < 1% of requests
- **Circuit Breaker Recovery**: < 60 seconds

## Troubleshooting

### Circuit Breaker Stuck Open

Check circuit breaker status:
```typescript
import { getCircuitBreakerStatus } from '@/lib/error-handling/resilient-fetch'

const status = getCircuitBreakerStatus('my-service')
console.log(status)
```

### Database Connection Issues

Check health endpoint for database status. Verify environment variables are set correctly.

### High Error Rates

1. Check Sentry for error patterns
2. Review circuit breaker statuses
3. Check external service health
4. Verify rate limits not exceeded

## Alerting

Configure alerts in Sentry for:
- Error rate > 5%
- p95 latency > 1000ms
- Circuit breaker open > 5 minutes
- Database connection failures
- Critical operations failing
```
