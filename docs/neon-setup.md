# Neon Database Setup Guide

## Overview

This project uses **Neon Postgres** with the `@neondatabase/serverless` driver, optimized for Vercel deployments.

## Architecture

- **Prisma ORM**: Used for complex schema management and type-safe queries
- **Neon Serverless Driver**: Used for direct SQL queries in edge/serverless functions

## Environment Variables

Ensure these are set in your `.env.local` and Vercel dashboard:

```env
NEON_DATABASE_URL="postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require"
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require"
```

## Usage Examples

### Server Component (Data Fetching)

```tsx
import { sql } from '@/lib/db';

export default async function Page() {
  const users = await sql`SELECT * FROM users LIMIT 10`;
  return <div>{users.map(u => u.name)}</div>;
}
```

### Server Action (Data Mutation)

```tsx
async function createUser(formData: FormData) {
  'use server';
  const name = formData.get('name');
  await sql`INSERT INTO users (name) VALUES (${name})`;
  revalidatePath('/users');
}
```

### API Route

```ts
import { sql } from '@/lib/db';

export async function GET() {
  const result = await sql`SELECT COUNT(*) FROM users`;
  return Response.json(result);
}
```

## Test Pages

Visit these URLs to test the connection:

- `/db-test` - Connection status and database info
- `/db-test/action` - Server Action form example
- `/api/db/version` - API Route endpoint

## Why @neondatabase/serverless?

- ✅ Optimized for Vercel Edge & Serverless
- ✅ HTTP-based connections (no WebSocket required)
- ✅ Built-in connection pooling
- ✅ Low latency with Neon's serverless architecture
- ✅ Works alongside Prisma for flexible query patterns

## Best Practices

1. **Use Prisma** for complex schemas and migrations
2. **Use Direct SQL** for simple queries and edge functions
3. Always use parameterized queries: `` sql`SELECT * FROM users WHERE id = ${id}` ``
4. Never expose database credentials in client-side code
5. Import from `@/lib/db` only in server-side code
