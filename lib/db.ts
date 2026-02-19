import { neon } from "@neondatabase/serverless"

// Neon serverless driver for direct SQL queries (optimized for Vercel Edge/Serverless)
export const sql = neon(process.env.NEON_DATABASE_URL || process.env.DATABASE_URL!)
