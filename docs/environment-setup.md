# Environment Variables Setup Guide

This guide explains how to configure environment variables for the HBU Asset Recovery application.

## Quick Start

1. **Copy the template**:
   ```bash
   npm run env:setup
   # or manually:
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** with your actual values

3. **Validate your configuration**:
   ```bash
   npm run env:validate
   ```

4. **Start the application**:
   ```bash
   npm run dev
   ```

## Required Environment Variables

These variables **must** be configured for the application to function:

### Authentication (Clerk)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**How to get these:**
1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Choose "Next.js" as your framework
4. Copy the keys from your dashboard

### Database (PostgreSQL)

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

**Options:**
- **Local PostgreSQL**: `postgresql://postgres:password@localhost:5432/hbu_recovery`
- **Neon** (recommended): Get from [neon.tech](https://neon.tech)
- **Supabase**: Get from [supabase.com](https://supabase.com)
- **Railway**: Get from [railway.app](https://railway.app)

**After setting up:**
```bash
npx prisma generate
npx prisma db push
```

## Optional but Recommended

### Supabase (for additional features)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Get these from [app.supabase.com](https://app.supabase.com) → Your Project → Settings → API

### AI Services

```bash
# OpenAI (for chatbot and AI features)
OPENAI_API_KEY=sk-...

# Alternative AI providers
ANTHROPIC_API_KEY=sk-ant-...
GROK_API_KEY=...
```

Get from:
- OpenAI: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Anthropic: [console.anthropic.com](https://console.anthropic.com)

### Communication Services

```bash
# Twilio (for SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# SendGrid (for email)
SENDGRID_API_KEY=SG....
```

## Optional Feature Groups

### Skip Tracing Services

Configure these if you're using specific skip tracing providers:

```bash
SKIP_GENIE_API_KEY=...
RESIMPLI_API_KEY=...
MOJO_API_KEY=...
SKIPFORCE_API_KEY=...
TRACERFY_API_KEY=...
ENDATO_API_KEY=...
ACCURATE_APPEND_API_KEY=...
TRESTLE_API_KEY=...
ZEROBOUNCE_API_KEY=...
```

### Blockchain & NFT

For bounty payment features:

```bash
BLOCKCHAIN_PRIVATE_KEY=...
BOUNTY_CONTRACT_ADDRESS=...
NFT_CONTRACT_ADDRESS=...
PINATA_API_KEY=...
PINATA_SECRET_KEY=...
```

### Payment Processing

```bash
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

### Project Management

```bash
# Trello integration
TRELLO_API_KEY=...
TRELLO_TOKEN=...
TRELLO_BOARD_ID=...
```

## Configuration Settings

### TCPA Compliance

```bash
# Quiet hours (24-hour format)
QUIET_HOURS_START=21:00
QUIET_HOURS_END=09:00

# SMS limits
MAX_DAILY_SMS=3

# DNC scrubbing
DNC_SCRUB_INTERVAL=24

# Opt-out expiry
OPT_OUT_EXPIRY_DAYS=365
```

### Business Rules

```bash
# AI prediction confidence (0-1)
PREDICTOR_CONFIDENCE=0.75

# Ethics score threshold (0-100)
ETHICS_THRESHOLD=70

# Revenue percentage (0-1)
REVENUE_TAKE_PERCENT=0.30

# Bulk processing
BULK_BATCH_SIZE=100
BULK_MIN_THRESHOLD=10
```

## Validation

Run the validation script to check your configuration:

```bash
npm run env:validate
```

This will:
- ✅ Check if `.env.local` exists
- ✅ Verify all required variables are set
- ✅ List configured optional features
- ✅ Provide helpful feedback for missing variables

## Environment Files

- **`.env.example`**: Template with all available variables
- **`.env.local`**: Your actual configuration (git-ignored)
- **`.env`**: Not used (use `.env.local` instead)
- **`.env.production`**: Production overrides (optional)

## Security Best Practices

1. **Never commit** `.env.local` to version control
2. **Use strong secrets** for `CRON_SECRET` and other security tokens
3. **Rotate keys regularly**, especially after team member changes
4. **Use environment-specific** keys (test keys in development)
5. **Store production secrets** in Vercel Environment Variables dashboard

## Vercel Deployment

When deploying to Vercel:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add your variables for Production, Preview, and Development
4. Vercel will automatically inject them during build and runtime

## Troubleshooting

### "Missing required environment variables"

**Solution:** Run `npm run env:validate` to see which variables are missing

### "Clerk: Missing publishableKey"

**Cause:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` not set

**Solution:** Add Clerk keys to `.env.local`

### "Database connection failed"

**Causes:**
- Invalid `DATABASE_URL` format
- Database server not running
- Incorrect credentials
- Network/firewall issues

**Solution:**
1. Verify PostgreSQL is running
2. Check connection string format
3. Test connection: `npx prisma db pull`

### "Cannot find module 'dotenv'"

**Solution:** Install dotenv:
```bash
npm install dotenv
```

### Variables not loading

**Causes:**
- File named incorrectly (must be `.env.local`)
- File in wrong directory (must be in project root)
- Next.js cache issue

**Solution:**
```bash
rm -rf .next
npm run dev
```

## Examples

### Minimal Development Setup

For local development with minimal features:

```bash
# Required
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
DATABASE_URL=postgresql://postgres:password@localhost:5432/hbu_dev

# Optional
NODE_ENV=development
DEBUG=true
```

### Full Production Setup

For production deployment with all features:

```bash
# Core
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://hbu.ai
DATABASE_URL=postgresql://...@...neon.tech/hbu_prod

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx

# Services
OPENAI_API_KEY=sk-xxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
STRIPE_SECRET_KEY=sk_live_xxx

# Skip Tracing (all providers)
SKIP_GENIE_API_KEY=xxx
RESIMPLI_API_KEY=xxx
# ... etc

# TCPA Compliance
QUIET_HOURS_START=21:00
QUIET_HOURS_END=09:00
MAX_DAILY_SMS=3

# Security
CRON_SECRET=xxx
AUDIT_LOG_RETENTION=90
```

## Support

If you need help with environment configuration:

1. Check `.env.example` for variable descriptions
2. Run `npm run env:validate` for diagnostics
3. Refer to the [main README](../README.md)
4. Check service provider documentation (links in `.env.example`)

## Summary

| Category | Variables | Required | Features Enabled |
|----------|-----------|----------|------------------|
| Core | 3 | ✅ Yes | Authentication, Database |
| Supabase | 3 | ⚪ No | Additional storage, auth |
| AI Services | 3 | ⚪ No | Chatbot, predictions |
| Communication | 5 | ⚪ No | SMS, Email outreach |
| Skip Tracing | 9 | ⚪ No | Lead enrichment |
| Blockchain | 5 | ⚪ No | Bounty payments, NFTs |
| Payments | 6 | ⚪ No | Stripe, PayPal |
| Project Mgmt | 3 | ⚪ No | Trello integration |
| Config | 11 | ⚪ No | TCPA, business rules |

**Total: ~50 environment variables** (3 required, 47 optional)
