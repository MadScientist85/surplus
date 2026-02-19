"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Textarea } from "@/components/ui/textarea"
import { createTeam } from "@/lib/actions/team.actions"
import { Plus, Users, Crown, Shield, Eye, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Team {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  plan: string
  role: string
  owner: { name: string | null; email: string }
  _count: { members: number; apiKeys: number }
  joinedAt: Date | null
}

interface TeamsContentProps {
  initialTeams: Team[]
}

export function TeamsContent({ initialTeams }: TeamsContentProps) {
  const [teams, setTeams] = useState(initialTeams)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newTeam, setNewTeam] = useState({ name: "", slug: "", description: "" })
  const router = useRouter()
  const { toast } = useToast()

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const team = await createTeam({
        name: newTeam.name,
        slug: newTeam.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        description: newTeam.description || undefined,
      })

      toast({
        title: "Team created",
        description: `${newTeam.name} has been created successfully.`,
      })

      setIsCreateOpen(false)
      setNewTeam({ name: "", slug: "", description: "" })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-orange-600"
      case "admin":
        return "bg-blue-600"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {teams.length} team{teams.length !== 1 ? "s" : ""}
        </p>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-500">
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-neutral-900 border-orange-900/50">
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>Create a team to collaborate on asset recovery</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={newTeam.name}
                  onChange={(e) => {
                    setNewTeam({
                      ...newTeam,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    })
                  }}
                  placeholder="My Recovery Team"
                  className="bg-neutral-800 border-neutral-700"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team-slug">Team URL</Label>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-2">hbu.app/team/</span>
                  <Input
                    id="team-slug"
                    value={newTeam.slug}
                    onChange={(e) => setNewTeam({ ...newTeam, slug: e.target.value })}
                    placeholder="my-team"
                    className="bg-neutral-800 border-neutral-700"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="team-description">Description (optional)</Label>
                <Textarea
                  id="team-description"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  placeholder="Describe your team's focus..."
                  className="bg-neutral-800 border-neutral-700"
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-500">
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Team
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {teams.length === 0 ? (
        <Card className="bg-neutral-900 border-orange-900/50">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No teams yet</h3>
            <p className="text-muted-foreground mb-4">Create a team to collaborate with others on asset recovery</p>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-orange-600 hover:bg-orange-500">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link key={team.id} href={`/dashboard/teams/${team.id}`}>
              <Card className="bg-neutral-900 border-orange-900/50 hover:border-orange-500/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={team.imageUrl || undefined} />
                      <AvatarFallback className="bg-orange-600 text-white">
                        {team.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Badge className={`${getRoleBadgeColor(team.role)} text-white`}>
                      {getRoleIcon(team.role)}
                      <span className="ml-1 capitalize">{team.role}</span>
                    </Badge>
                  </div>
                  <CardTitle className="text-white">{team.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{team.description || `/${team.slug}`}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        <Users className="h-4 w-4 inline mr-1" />
                        {team._count.members} member{team._count.members !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {team.plan}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
