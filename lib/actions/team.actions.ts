"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

// Get all teams for current user
export async function getUserTeams() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          owner: true,
          members: {
            include: { user: true },
          },
          _count: { select: { members: true, apiKeys: true } },
        },
      },
    },
  })

  return memberships.map((m) => ({
    ...m.team,
    role: m.role,
    joinedAt: m.joinedAt,
  }))
}

// Get single team with members
export async function getTeam(teamId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  // Check membership
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  })
  if (!membership) throw new Error("Not a member of this team")

  return await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      owner: true,
      members: { include: { user: true } },
      apiKeys: { where: { revokedAt: null } },
    },
  })
}

// Create new team
export async function createTeam(data: {
  name: string
  slug: string
  description?: string
}) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  // Check slug availability
  const existing = await prisma.team.findUnique({
    where: { slug: data.slug },
  })
  if (existing) throw new Error("Team slug already taken")

  const team = await prisma.team.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: "owner",
          joinedAt: new Date(),
        },
      },
    },
    include: { members: true },
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      action: "team_created",
      resource: "team",
      resourceId: team.id,
      metadata: { name: data.name, slug: data.slug },
    },
  })

  revalidatePath("/dashboard/teams")
  return team
}

// Update team
export async function updateTeam(
  teamId: string,
  data: {
    name?: string
    description?: string
    imageUrl?: string
  },
) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  // Check ownership or admin role
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  })
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("Insufficient permissions")
  }

  const updated = await prisma.team.update({
    where: { id: teamId },
    data: { ...data, updatedAt: new Date() },
  })

  revalidatePath("/dashboard/teams")
  return updated
}

// Invite team member
export async function inviteTeamMember(
  teamId: string,
  data: {
    email: string
    role: string
  },
) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  // Check admin rights
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  })
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("Insufficient permissions")
  }

  // Find user by email
  const invitedUser = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (!invitedUser) {
    throw new Error("User not found. They must sign up first.")
  }

  // Check if already a member
  const existingMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: invitedUser.id } },
  })
  if (existingMember) throw new Error("User is already a team member")

  const member = await prisma.teamMember.create({
    data: {
      teamId,
      userId: invitedUser.id,
      role: data.role,
      invitedBy: userId,
      invitedAt: new Date(),
    },
    include: { user: true },
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      action: "team_member_invited",
      resource: "team_member",
      resourceId: member.id,
      metadata: { email: data.email, role: data.role, teamId },
    },
  })

  revalidatePath("/dashboard/teams")
  return member
}

// Remove team member
export async function removeTeamMember(teamId: string, memberId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  // Check admin rights
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  })
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("Insufficient permissions")
  }

  // Can't remove owner
  const targetMember = await prisma.teamMember.findUnique({
    where: { id: memberId },
    include: { team: true },
  })
  if (targetMember?.role === "owner") {
    throw new Error("Cannot remove team owner")
  }

  await prisma.teamMember.delete({
    where: { id: memberId },
  })

  revalidatePath("/dashboard/teams")
  return { success: true }
}

// Delete team
export async function deleteTeam(teamId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const team = await prisma.team.findUnique({
    where: { id: teamId },
  })
  if (!team || team.ownerId !== userId) {
    throw new Error("Only team owner can delete the team")
  }

  await prisma.team.delete({
    where: { id: teamId },
  })

  revalidatePath("/dashboard/teams")
  return { success: true }
}
