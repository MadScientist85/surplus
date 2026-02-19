# HBU Asset Recovery API Reference

## Authentication

All API requests require Clerk authentication. Include the bearer token in the Authorization header:

```
Authorization: Bearer YOUR_CLERK_TOKEN
```

## Endpoints

### Lead Management

#### GET /api/leads
Get all leads for the authenticated user.

**Query Parameters:**
- `status`: Filter by status (new, enriched, contacted, filed, recovered)
- `state`: Filter by state code
- `minAmount`: Minimum surplus amount

**Response:**
```json
{
  "leads": [
    {
      "id": "cl_...",
      "name": "John Doe",
      "surplusAmount": 28500,
      "county": "Oklahoma",
      "state": "OK",
      "status": "new",
      "phones": ["+1234567890"],
      "emails": ["john@example.com"]
    }
  ]
}
```

### Tool Execution

#### POST /api/tools/execute
Execute MCP tools via AI agent.

**Body:**
```json
{
  "prompt": "Skip trace all new leads from today"
}
```

**Response:**
```json
{
  "tools_executed": [
    {
      "tool": "skip_trace",
      "result": { "enriched": 15 }
    }
  ],
  "final_answer": "Enriched 15 leads successfully"
}
```

### Webhooks

#### POST /api/webhooks/trello
Trello webhook handler for board updates.

#### POST /api/webhooks/twilio
Twilio webhook for SMS replies and opt-outs.

### Cron Jobs

#### GET /api/cron/apocalypse
Trigger the daily data apocalypse.

**Headers:**
```
Authorization: Bearer CRON_SECRET
```

## Rate Limits

- API: 100 requests/minute
- Scraping: 1 request/second
- Tool Execution: 10 requests/minute

## Error Codes

- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Missing or invalid auth token
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - System error
