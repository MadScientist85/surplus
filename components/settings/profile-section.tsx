"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateUserProfile } from "@/lib/actions/user.actions"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProfileSectionProps {
  user: {
    id: string
    email: string
    name: string | null
    imageUrl: string | null
    createdAt: Date
  }
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const [name, setName] = useState(user.name || "")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await updateUserProfile({ name })
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <Card className="bg-neutral-900 border-orange-900/50">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your profile details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-2 border-orange-500">
              <AvatarImage src={user.imageUrl || undefined} />
              <AvatarFallback className="bg-orange-600 text-white text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Profile photo managed by Clerk</p>
              <p className="text-xs text-gray-500">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="bg-neutral-800 border-neutral-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" value={user.email} disabled className="bg-neutral-800 border-neutral-700 opacity-50" />
              <p className="text-xs text-muted-foreground">Email managed by Clerk</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-500">
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
