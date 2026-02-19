"use server"

import { prisma } from "@/lib/prisma"
import { auth, currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

// Get or create user from Clerk
export async function getOrCreateUser() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const clerkUser = await currentUser()
  if (!clerkUser) throw new Error("User not found")

  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: { settings: true, teamMemberships: { include: { team: true } } },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
        imageUrl: clerkUser.imageUrl || null,
        settings: {
          create: {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
            weeklyDigest: true,
            theme: "system",
            timezone: "America/Chicago",
            language: "en",
          },
        },
      },
      include: { settings: true, teamMemberships: { include: { team: true } } },
    })
  }

  return user
}

// Get current user with all relations
export async function getCurrentUser() {
  const { userId } = await auth()
  if (!userId) return null

  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      settings: true,
      teamMemberships: { include: { team: true } },
      ownedTeams: true,
      apiKeys: { where: { revokedAt: null } },
    },
  })
}

// Update user profile
export async function updateUserProfile(data: {
  name?: string
  imageUrl?: string
}) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      imageUrl: data.imageUrl,
      updatedAt: new Date(),
    },
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      action: "profile_updated",
      resource: "user",
      resourceId: userId,
      metadata: data,
    },
  })

  revalidatePath("/dashboard/settings")
  return updated
}
