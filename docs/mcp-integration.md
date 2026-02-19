# MCP (Multi-Chain Protocol) Integration Guide

## Overview

The MCP system provides unified tool calling across multiple AI providers with automatic fallback, webhook-based event reactors, and orchestrated API dominion.

## Architecture

### Tool Calling System

MCP enables natural language commands that automatically execute tools:

```typescript
await mcpExecute("File claim for lead CL-2025-118 in Oklahoma County");
```

### Available Tools

1. **skip_trace** - Enrich lead with contact information
2. **file_claim** - Auto-file surplus claim with county
3. **send_sms** - Send TCPA-compliant SMS
4. **generate_nft** - Mint ethics guarantee NFT
5. **check_dnc** - Scrub phone against DoNotCall.gov
6. **get_lead_status** - Query lead information

### Webhook Nexus

Real-time event processing:

- **Twilio STOP**: Automatic opt-out handling
- **DocuSign Signed**: Auto-file when contracts complete
- **Clerk Update**: Disburse funds when approved
- **Polygon Bounty**: NFT minting on payment

### API Dominion

All external APIs wrapped with circuit breakers:

- Skip tracing providers (8x cascade)
- Filing systems (50 states)
- Communication channels (SMS/Email)
- Blockchain (Polygon)
- Compliance (DNC, TCPA)

## Usage

### Command Interface

Use the Sovereign Command interface in the dashboard to execute natural language commands:

```
> "Skip trace all Florida leads over $20K"
> "File claims for approved Miami-Dade operations"
> "Send SMS to leads with clean DNC status"
```

### Programmatic Access

```typescript
import { mcpExecute } from "@/lib/ai/mcp-tool-calling";

const result = await mcpExecute(
  "Check DNC status and send SMS if clean",
  { leadId: "lead-123" }
);
```

### Webhook Setup

Configure webhooks in your integrations:

- **Twilio**: POST to `/api/webhooks/twilio`
- **DocuSign**: POST to `/api/webhooks/docusign`
- **County Clerk**: POST to `/api/webhooks/clerk-update`

## Monitoring

Track tool execution in the Tool Status Oracle dashboard:

- Total executions
- Success/failure rates
- Average duration
- Recent activity timeline

## Security

All tool executions are:

- Authenticated with Clerk
- Logged to Sentry
- Stored in database
- Rate limited per user
- Circuit breaker protected
