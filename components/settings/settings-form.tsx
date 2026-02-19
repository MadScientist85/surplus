"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateUserSettings, type UserSettingsInput } from "@/lib/actions/settings.actions"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
]

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
]

interface SettingsFormProps {
  settings: any
  section: "notifications" | "appearance" | "recovery"
}

export function SettingsForm({ settings, section }: SettingsFormProps) {
  const [formData, setFormData] = useState<UserSettingsInput>({
    emailNotifications: settings?.emailNotifications ?? true,
    smsNotifications: settings?.smsNotifications ?? false,
    pushNotifications: settings?.pushNotifications ?? true,
    weeklyDigest: settings?.weeklyDigest ?? true,
    marketingEmails: settings?.marketingEmails ?? false,
    productUpdates: settings?.productUpdates ?? true,
    theme: settings?.theme ?? "system",
    timezone: settings?.timezone ?? "America/Chicago",
    language: settings?.language ?? "en",
    dateFormat: settings?.dateFormat ?? "MM/DD/YYYY",
    defaultState: settings?.defaultState ?? "AL",
    autoEnrichLeads: settings?.autoEnrichLeads ?? true,
    autoFileThreshold: settings?.autoFileThreshold ? Number(settings.autoFileThreshold) : undefined,
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await updateUserSettings(formData)
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field: keyof UserSettingsInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (section === "notifications") {
    return (
      <Card className="bg-neutral-900 border-orange-900/50">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div>
                  <p className="font-medium text-white">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive email updates about your claims</p>
                </div>
                <Switch
                  checked={formData.emailNotifications}
                  onCheckedChange={(v) => updateField("emailNotifications", v)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div>
                  <p className="font-medium text-white">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Get text alerts for urgent updates</p>
                </div>
                <Switch
                  checked={formData.smsNotifications}
                  onCheckedChange={(v) => updateField("smsNotifications", v)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div>
                  <p className="font-medium text-white">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Browser notifications for real-time updates</p>
                </div>
                <Switch
                  checked={formData.pushNotifications}
                  onCheckedChange={(v) => updateField("pushNotifications", v)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div>
                  <p className="font-medium text-white">Weekly Digest</p>
                  <p className="text-sm text-muted-foreground">Summary of your recovery activity</p>
                </div>
                <Switch checked={formData.weeklyDigest} onCheckedChange={(v) => updateField("weeklyDigest", v)} />
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div>
                  <p className="font-medium text-white">Marketing Emails</p>
                  <p className="text-sm text-muted-foreground">News and promotions from HBU</p>
                </div>
                <Switch checked={formData.marketingEmails} onCheckedChange={(v) => updateField("marketingEmails", v)} />
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div>
                  <p className="font-medium text-white">Product Updates</p>
                  <p className="text-sm text-muted-foreground">New features and improvements</p>
                </div>
                <Switch checked={formData.productUpdates} onCheckedChange={(v) => updateField("productUpdates", v)} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-500">
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Preferences
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  if (section === "appearance") {
    return (
      <Card className="bg-neutral-900 border-orange-900/50">
        <CardHeader>
          <CardTitle>Appearance & Regional</CardTitle>
          <CardDescription>Customize your display preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={formData.theme} onValueChange={(v) => updateField("theme", v)}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={formData.timezone} onValueChange={(v) => updateField("timezone", v)}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={formData.language} onValueChange={(v) => updateField("language", v)}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select value={formData.dateFormat} onValueChange={(v) => updateField("dateFormat", v)}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-500">
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Preferences
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  // Recovery section
  return (
    <Card className="bg-neutral-900 border-orange-900/50">
      <CardHeader>
        <CardTitle>Recovery Preferences</CardTitle>
        <CardDescription>Configure your asset recovery automation</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Default State</Label>
              <Select value={formData.defaultState || "AL"} onValueChange={(v) => updateField("defaultState", v)}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700">
                  <SelectValue placeholder="Select default state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No default</SelectItem>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Primary state for lead searches</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
              <div>
                <p className="font-medium text-white">Auto-Enrich Leads</p>
                <p className="text-sm text-muted-foreground">Automatically skip trace new leads</p>
              </div>
              <Switch checked={formData.autoEnrichLeads} onCheckedChange={(v) => updateField("autoEnrichLeads", v)} />
            </div>

            <div className="space-y-2">
              <Label>Auto-File Threshold ($)</Label>
              <Input
                type="number"
                value={formData.autoFileThreshold || ""}
                onChange={(e) => updateField("autoFileThreshold", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="e.g., 5000"
                className="bg-neutral-800 border-neutral-700"
              />
              <p className="text-xs text-muted-foreground">
                Auto-file claims above this amount (leave empty to disable)
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-500">
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Preferences
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
