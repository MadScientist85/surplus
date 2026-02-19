"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export interface UserSettingsInput {
  emailNotifications?: boolean
  smsNotifications?: boolean
  pushNotifications?: boolean
  weeklyDigest?: boolean
  marketingEmails?: boolean
  productUpdates?: boolean
  theme?: string
  timezone?: string
  language?: string
  dateFormat?: string
  defaultState?: string
  autoEnrichLeads?: boolean
  autoFileThreshold?: number
}

// Get user settings
export async function getUserSettings() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  })

  if (!settings) {
    // Create default settings
    return await prisma.userSettings.create({
      data: {
        userId,
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        weeklyDigest: true,
        theme: "system",
        timezone: "America/Chicago",
        language: "en",
        dateFormat: "MM/DD/YYYY",
      },
    })
  }

  return settings
}

// Update user settings
export async function updateUserSettings(data: UserSettingsInput) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const updated = await prisma.userSettings.upsert({
    where: { userId },
    update: {
      ...data,
      autoFileThreshold: data.autoFileThreshold ? Number.parseFloat(data.autoFileThreshold.toString()) : undefined,
      updatedAt: new Date(),
    },
    create: {
      userId,
      emailNotifications: data.emailNotifications ?? true,
      smsNotifications: data.smsNotifications ?? false,
      pushNotifications: data.pushNotifications ?? true,
      weeklyDigest: data.weeklyDigest ?? true,
      theme: data.theme ?? "system",
      timezone: data.timezone ?? "America/Chicago",
      language: data.language ?? "en",
      dateFormat: data.dateFormat ?? "MM/DD/YYYY",
      defaultState: data.defaultState,
      autoEnrichLeads: data.autoEnrichLeads ?? true,
      autoFileThreshold: data.autoFileThreshold ? Number.parseFloat(data.autoFileThreshold.toString()) : undefined,
    },
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      action: "settings_updated",
      resource: "user_settings",
      resourceId: updated.id,
      metadata: data,
    },
  })

  revalidatePath("/dashboard/settings")
  return updated
}
