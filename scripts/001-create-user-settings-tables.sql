-- HBU Recovery - User, Settings, Teams, and API Keys Migration
-- Run this script to create all necessary tables for user management

-- Create User table (syncs with Clerk)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- Create UserSettings table
CREATE TABLE IF NOT EXISTS "UserSettings" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "emailNotifications" BOOLEAN DEFAULT true,
    "smsNotifications" BOOLEAN DEFAULT false,
    "pushNotifications" BOOLEAN DEFAULT true,
    "weeklyDigest" BOOLEAN DEFAULT true,
    "marketingEmails" BOOLEAN DEFAULT false,
    "productUpdates" BOOLEAN DEFAULT true,
    "theme" TEXT DEFAULT 'system',
    "timezone" TEXT DEFAULT 'America/Chicago',
    "language" TEXT DEFAULT 'en',
    "dateFormat" TEXT DEFAULT 'MM/DD/YYYY',
    "defaultState" TEXT,
    "autoEnrichLeads" BOOLEAN DEFAULT true,
    "autoFileThreshold" DECIMAL(10, 2),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "UserSettings_userId_idx" ON "UserSettings"("userId");

-- Create Team table
CREATE TABLE IF NOT EXISTS "Team" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "slug" TEXT UNIQUE NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "ownerId" TEXT NOT NULL REFERENCES "User"("id"),
    "plan" TEXT DEFAULT 'free',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "monthlyLeadLimit" INTEGER DEFAULT 100,
    "monthlyLeadsUsed" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Team_ownerId_idx" ON "Team"("ownerId");
CREATE INDEX IF NOT EXISTS "Team_slug_idx" ON "Team"("slug");

-- Create TeamMember table
CREATE TABLE IF NOT EXISTS "TeamMember" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "teamId" TEXT NOT NULL REFERENCES "Team"("id") ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "role" TEXT DEFAULT 'member',
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP WITH TIME ZONE,
    UNIQUE("teamId", "userId")
);

CREATE INDEX IF NOT EXISTS "TeamMember_teamId_idx" ON "TeamMember"("teamId");
CREATE INDEX IF NOT EXISTS "TeamMember_userId_idx" ON "TeamMember"("userId");

-- Create ApiKey table
CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "key" TEXT UNIQUE NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHint" TEXT NOT NULL,
    "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
    "teamId" TEXT REFERENCES "Team"("id") ON DELETE CASCADE,
    "permissions" TEXT[] DEFAULT ARRAY['read'],
    "rateLimit" INTEGER DEFAULT 1000,
    "lastUsedAt" TIMESTAMP WITH TIME ZONE,
    "usageCount" INTEGER DEFAULT 0,
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    "revokedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey"("userId");
CREATE INDEX IF NOT EXISTS "ApiKey_teamId_idx" ON "ApiKey"("teamId");
CREATE INDEX IF NOT EXISTS "ApiKey_key_idx" ON "ApiKey"("key");

-- Create ActivityLog table
CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX IF NOT EXISTS "ActivityLog_action_idx" ON "ActivityLog"("action");
CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- Add userId column to Lead table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Lead' AND column_name = 'userId') THEN
        ALTER TABLE "Lead" ADD COLUMN "userId" TEXT;
    END IF;
END $$;

-- Create index on Lead.userId if it doesn't exist
CREATE INDEX IF NOT EXISTS "Lead_userId_idx" ON "Lead"("userId");

-- Add relation constraint (optional - only if Lead table exists and you want to enforce FK)
-- ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'HBU Recovery user management tables created successfully!';
END $$;
