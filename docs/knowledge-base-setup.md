# Knowledge Base & AI Paralegal Setup Guide

## Overview

The HBU Asset Recovery platform includes a comprehensive knowledge base powered by Supabase and an AI paralegal assistant using Grok AI for 24/7 legal guidance.

## Architecture

### Components

1. **Supabase Knowledge Base**: Vector-based storage for legal knowledge
2. **AI Paralegal**: Grok-powered Q&A with state-specific expertise
3. **Self-Audit System**: Automated compliance checking for leads

## Setup Instructions

### 1. Supabase Schema

Run this SQL in your Supabase project:

```sql
-- Create knowledge_base table
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (category IN ('state-law', 'procedure', 'compliance', 'general')),
  state VARCHAR(2),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  sources TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create full-text search index
CREATE INDEX knowledge_base_question_idx ON knowledge_base USING gin(to_tsvector('english', question));
CREATE INDEX knowledge_base_answer_idx ON knowledge_base USING gin(to_tsvector('english', answer));
CREATE INDEX knowledge_base_state_idx ON knowledge_base(state);
CREATE INDEX knowledge_base_category_idx ON knowledge_base(category);

-- Enable Row Level Security
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read
CREATE POLICY "Allow read access to authenticated users"
  ON knowledge_base
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can write (you'll need to implement admin role check)
CREATE POLICY "Allow write access to admins"
  ON knowledge_base
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
```

### 2. Seed Data

Populate the knowledge base with common questions:

```typescript
import { addKnowledgeEntry } from '@/lib/knowledge/supabase-kb'

const seedData = [
  {
    category: 'state-law' as const,
    state: 'FL',
    question: 'What is the statute of limitations for unclaimed property in Florida?',
    answer: 'Florida has no statute of limitations for unclaimed property. Property can be claimed indefinitely under Florida Statute § 717.',
    tags: ['florida', 'statute', 'limitations'],
    sources: ['Florida Statute § 717.001-717.1401']
  },
  {
    category: 'procedure' as const,
    question: 'How do I file a claim for surplus funds?',
    answer: 'Filing procedures vary by state. Generally: 1) Verify ownership, 2) Complete state-specific claim form, 3) Provide identification, 4) Submit proof of ownership, 5) Wait for processing (30-90 days typical).',
    tags: ['filing', 'procedure', 'surplus'],
    sources: ['NUPAP Guidelines', 'State-specific statutes']
  },
  // Add more entries...
]

for (const entry of seedData) {
  await addKnowledgeEntry(entry)
}
```

### 3. Environment Variables

Required variables are automatically configured through the Vercel Supabase integration. Additional variables needed:

```bash
# Grok AI (xAI) - Add this to your Vercel environment variables
XAI_API_KEY=your_xai_key
```

## Usage

### AI Paralegal Chat

```typescript
import { askAIParalegal } from '@/lib/knowledge/ai-paralegal'

const response = await askAIParalegal({
  question: 'What documents do I need to file a claim in California?',
  state: 'CA',
  context: 'Client has proof of ownership via deed'
})

console.log(response.answer)
console.log('Confidence:', response.confidence)
console.log('Sources:', response.sources)
```

### Knowledge Base Search

```typescript
import { searchKnowledgeBase } from '@/lib/knowledge/supabase-kb'

const results = await searchKnowledgeBase(
  'surplus funds',
  'procedure',
  'FL'
)
```

### Self-Audit

```typescript
import { selfAudit } from '@/lib/knowledge/ai-paralegal'

const audit = await selfAudit(leadId)

if (audit.passed) {
  console.log('Lead passed compliance audit')
} else {
  console.log('Issues found:', audit.auditResults)
}
```

## API Endpoints

### POST /api/knowledge/qa
Ask the AI paralegal a question.

**Request:**
```json
{
  "question": "What is the filing fee in Texas?",
  "state": "TX",
  "leadId": "optional-lead-id",
  "context": "optional additional context"
}
```

**Response:**
```json
{
  "answer": "Detailed answer...",
  "confidence": 0.92,
  "sources": ["Texas Property Code § 74.001"],
  "relatedQuestions": ["How long...", "What documents..."]
}
```

### GET /api/knowledge/search
Search the knowledge base.

**Query Parameters:**
- `q` (required): Search query
- `category`: Filter by category
- `state`: Filter by state

### POST /api/knowledge/audit
Run compliance audit on a lead.

**Request:**
```json
{
  "leadId": "uuid"
}
```

## Best Practices

1. **Keep KB Updated**: Regularly add new rulings and statute changes
2. **Review AI Responses**: While high confidence, always verify critical legal advice
3. **State-Specific Context**: Always provide state context for accurate answers
4. **Audit Regularly**: Run self-audits before major filings
5. **Source Verification**: Cross-reference AI-provided sources

## Monitoring

All operations are instrumented with Sentry:
- Query latency tracking
- Confidence score monitoring
- Error rate alerts
- Source citation tracking

## Future Enhancements

- [ ] Vector embeddings for semantic search
- [ ] Multi-language support
- [ ] Voice interface integration
- [ ] Case law integration
- [ ] Automated statute update monitoring
