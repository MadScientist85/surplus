"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

// Generate a secure API key
function generateApiKey(prefix = "hbu_live_"): { key: string; hash: string; hint: string } {
  const randomBytes = crypto.randomBytes(32).toString("hex")
  const key = `${prefix}${randomBytes}`
  const hash = crypto.createHash("sha256").update(key).digest("hex")
  const hint = randomBytes.slice(-4)
  return { key, hash, hint }
}

// Get user's API keys
export async function getUserApiKeys() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  return await prisma.apiKey.findMany({
    where: {
      userId,
      revokedAt: null,
    },
    orderBy: { createdAt: "desc" },
  })
}

// Get team API keys
export async function getTeamApiKeys(teamId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  // Check team membership
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  })
  if (!membership) throw new Error("Not a team member")

  return await prisma.apiKey.findMany({
    where: {
      teamId,
      revokedAt: null,
    },
    orderBy: { createdAt: "desc" },
  })
}

// Create new API key
export async function createApiKey(data: {
  name: string
  permissions?: string[]
  rateLimit?: number
  expiresAt?: Date
  teamId?: string
}): Promise<{ apiKey: any; plainTextKey: string }> {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  // If team key, check permissions
  if (data.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: data.teamId, userId } },
    })
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("Insufficient permissions to create team API key")
    }
  }

  const prefix = data.teamId ? "hbu_team_" : "hbu_live_"
  const { key, hash, hint } = generateApiKey(prefix)

  const apiKey = await prisma.apiKey.create({
    data: {
      name: data.name,
      key: hash,
      keyPrefix: prefix,
      keyHint: hint,
      userId: data.teamId ? null : userId,
      teamId: data.teamId || null,
      permissions: data.permissions || ["read"],
      rateLimit: data.rateLimit || 1000,
      expiresAt: data.expiresAt,
    },
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      action: "api_key_created",
      resource: "api_key",
      resourceId: apiKey.id,
      metadata: { name: data.name, teamId: data.teamId },
    },
  })

  revalidatePath("/dashboard/api-keys")

  // Return both the API key record and the plain text key (only shown once)
  return { apiKey, plainTextKey: key }
}

// Revoke API key
export async function revokeApiKey(keyId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const key = await prisma.apiKey.findUnique({
    where: { id: keyId },
    include: { team: true },
  })

  if (!key) throw new Error("API key not found")

  // Check ownership
  if (key.userId && key.userId !== userId) {
    throw new Error("Not authorized to revoke this key")
  }

  if (key.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: key.teamId, userId } },
    })
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("Not authorized to revoke team API keys")
    }
  }

  await prisma.apiKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      action: "api_key_revoked",
      resource: "api_key",
      resourceId: keyId,
    },
  })

  revalidatePath("/dashboard/api-keys")
  return { success: true }
}

// Validate API key (for API routes)
export async function validateApiKey(key: string) {
  const hash = crypto.createHash("sha256").update(key).digest("hex")

  const apiKey = await prisma.apiKey.findUnique({
    where: { key: hash },
    include: { user: true, team: true },
  })

  if (!apiKey) return null
  if (apiKey.revokedAt) return null
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null

  // Update usage
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 },
    },
  })

  return apiKey
}
