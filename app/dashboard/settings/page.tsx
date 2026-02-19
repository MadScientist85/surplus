import { Suspense } from "react"
import { getUserSettings, getCurrentUser } from "@/lib/actions"
import { SettingsForm } from "@/components/settings/settings-form"
import { ProfileSection } from "@/components/settings/profile-section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Bell, Palette, Shield, Workflow } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  )
}

async function SettingsContent() {
  const [user, settings] = await Promise.all([getCurrentUser(), getUserSettings()])

  if (!user) {
    return (
      <Card className="bg-neutral-900 border-orange-900/50">
        <CardContent className="p-6">
          <p className="text-red-400">Please sign in to access settings</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="bg-neutral-900 border border-orange-900/50">
        <TabsTrigger value="profile" className="data-[state=active]:bg-orange-600">
          <User className="h-4 w-4 mr-2" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="notifications" className="data-[state=active]:bg-orange-600">
          <Bell className="h-4 w-4 mr-2" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="appearance" className="data-[state=active]:bg-orange-600">
          <Palette className="h-4 w-4 mr-2" />
          Appearance
        </TabsTrigger>
        <TabsTrigger value="recovery" className="data-[state=active]:bg-orange-600">
          <Workflow className="h-4 w-4 mr-2" />
          Recovery
        </TabsTrigger>
        <TabsTrigger value="security" className="data-[state=active]:bg-orange-600">
          <Shield className="h-4 w-4 mr-2" />
          Security
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileSection user={user} />
      </TabsContent>

      <TabsContent value="notifications">
        <SettingsForm settings={settings} section="notifications" />
      </TabsContent>

      <TabsContent value="appearance">
        <SettingsForm settings={settings} section="appearance" />
      </TabsContent>

      <TabsContent value="recovery">
        <SettingsForm settings={settings} section="recovery" />
      </TabsContent>

      <TabsContent value="security">
        <Card className="bg-neutral-900 border-orange-900/50">
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your security preferences and sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
              <div>
                <p className="font-medium text-white">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <span className="text-orange-400 text-sm">Managed by Clerk</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
              <div>
                <p className="font-medium text-white">Active Sessions</p>
                <p className="text-sm text-muted-foreground">View and manage your active sessions</p>
              </div>
              <span className="text-orange-400 text-sm">Managed by Clerk</span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-[400px] bg-neutral-800" />
      <Skeleton className="h-[400px] w-full bg-neutral-800" />
    </div>
  )
}
