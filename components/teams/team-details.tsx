"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { inviteTeamMember, removeTeamMember, deleteTeam } from "@/lib/actions/team.actions"
import { ArrowLeft, Plus, Trash2, UserMinus, Crown, Shield, Eye, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TeamMember {
  id: string
  role: string
  joinedAt: Date | null
  user: {
    id: string
    name: string | null
    email: string
    imageUrl: string | null
  }
}

interface Team {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  plan: string
  ownerId: string
  owner: { id: string; name: string | null; email: string }
  members: TeamMember[]
  apiKeys: any[]
}

interface TeamDetailsProps {
  team: Team
}

export function TeamDetails({ team }: TeamDetailsProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [inviteData, setInviteData] = useState({ email: "", role: "member" })
  const router = useRouter()
  const { toast } = useToast()

  const isOwner = team.members.find((m) => m.role === "owner")?.user.id === team.ownerId
  const canManageMembers = team.members.some((m) => ["owner", "admin"].includes(m.role))

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await inviteTeamMember(team.id, inviteData)
      toast({
        title: "Member invited",
        description: `Invitation sent to ${inviteData.email}`,
      })
      setIsInviteOpen(false)
      setInviteData({ email: "", role: "member" })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to invite member",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeTeamMember(team.id, memberId)
      toast({ title: "Member removed" })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam(team.id)
      toast({ title: "Team deleted" })
      router.push("/dashboard/teams")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete team",
        variant: "destructive",
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3" />
      case "admin":
        return <Shield className="h-3 w-3" />
      default:
        return <Eye className="h-3 w-3" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/teams">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{team.name}</h1>
          <p className="text-muted-foreground">/{team.slug}</p>
        </div>
        <Badge variant="outline" className="capitalize">
          {team.plan}
        </Badge>
      </div>

      {team.description && (
        <Card className="bg-neutral-900 border-orange-900/50">
          <CardContent className="p-4">
            <p className="text-muted-foreground">{team.description}</p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-neutral-900 border-orange-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {team.members.length} member{team.members.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          {canManageMembers && (
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-500">
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-neutral-900 border-orange-900/50">
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>Invite someone to join {team.name}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={inviteData.email}
                      onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                      placeholder="colleague@company.com"
                      className="bg-neutral-800 border-neutral-700"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={inviteData.role} onValueChange={(v) => setInviteData({ ...inviteData, role: v })}>
                      <SelectTrigger className="bg-neutral-800 border-neutral-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member - View and edit claims</SelectItem>
                        <SelectItem value="admin">Admin - Manage team settings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-500">
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Send Invite
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {team.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.user.imageUrl || undefined} />
                    <AvatarFallback className="bg-orange-600">
                      {(member.user.name || member.user.email)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-white">{member.user.name || member.user.email}</p>
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {getRoleIcon(member.role)}
                    <span className="ml-1">{member.role}</span>
                  </Badge>
                  {canManageMembers && member.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isOwner && (
        <Card className="bg-neutral-900 border-red-900/50">
          <CardHeader>
            <CardTitle className="text-red-400">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-neutral-900 border-red-900/50">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {team.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All team data, API keys, and member associations will be permanently
                    deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteTeam} className="bg-red-600 hover:bg-red-500">
                    Delete Team
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
