"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  User,
  Settings,
  Key,
  Users,
  FileText,
  MessageSquare,
  LogIn,
  Shield,
  Activity,
  Search,
  Filter,
} from "lucide-react"

interface ActivityLog {
  id: string
  action: string
  resource: string | null
  resourceId: string | null
  metadata: any
  ipAddress: string | null
  createdAt: Date
}

interface ActivityContentProps {
  activities: ActivityLog[]
}

const ACTION_ICONS: Record<string, any> = {
  login: LogIn,
  profile_updated: User,
  settings_updated: Settings,
  api_key_created: Key,
  api_key_revoked: Key,
  team_created: Users,
  team_member_invited: Users,
  lead_created: FileText,
  sms_sent: MessageSquare,
  compliance_check: Shield,
  default: Activity,
}

const ACTION_LABELS: Record<string, string> = {
  login: "Logged in",
  profile_updated: "Updated profile",
  settings_updated: "Updated settings",
  api_key_created: "Created API key",
  api_key_revoked: "Revoked API key",
  team_created: "Created team",
  team_member_invited: "Invited team member",
  lead_created: "Created lead",
  sms_sent: "Sent SMS",
  compliance_check: "Compliance check",
}

const ACTION_COLORS: Record<string, string> = {
  login: "text-blue-400 bg-blue-400/10",
  profile_updated: "text-purple-400 bg-purple-400/10",
  settings_updated: "text-purple-400 bg-purple-400/10",
  api_key_created: "text-green-400 bg-green-400/10",
  api_key_revoked: "text-red-400 bg-red-400/10",
  team_created: "text-orange-400 bg-orange-400/10",
  team_member_invited: "text-orange-400 bg-orange-400/10",
  lead_created: "text-cyan-400 bg-cyan-400/10",
  sms_sent: "text-yellow-400 bg-yellow-400/10",
  compliance_check: "text-green-400 bg-green-400/10",
  default: "text-gray-400 bg-gray-400/10",
}

export function ActivityContent({ activities }: ActivityContentProps) {
  const [search, setSearch] = useState("")
  const [filterAction, setFilterAction] = useState<string>("all")

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      search === "" ||
      activity.action.toLowerCase().includes(search.toLowerCase()) ||
      activity.resource?.toLowerCase().includes(search.toLowerCase())

    const matchesFilter = filterAction === "all" || activity.action === filterAction

    return matchesSearch && matchesFilter
  })

  const uniqueActions = [...new Set(activities.map((a) => a.action))]

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity..."
            className="pl-9 bg-neutral-800 border-neutral-700"
          />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[180px] bg-neutral-800 border-neutral-700">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map((action) => (
              <SelectItem key={action} value={action}>
                {ACTION_LABELS[action] || action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredActivities.length === 0 ? (
        <Card className="bg-neutral-900 border-orange-900/50">
          <CardContent className="p-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No activity found</h3>
            <p className="text-muted-foreground">
              {search || filterAction !== "all" ? "Try adjusting your filters" : "Your activity will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredActivities.map((activity) => {
            const Icon = ACTION_ICONS[activity.action] || ACTION_ICONS.default
            const colorClass = ACTION_COLORS[activity.action] || ACTION_COLORS.default

            return (
              <Card key={activity.id} className="bg-neutral-900 border-orange-900/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white">{ACTION_LABELS[activity.action] || activity.action}</p>
                        {activity.resource && (
                          <Badge variant="outline" className="text-xs">
                            {activity.resource}
                          </Badge>
                        )}
                      </div>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <p className="text-sm text-muted-foreground truncate">
                          {JSON.stringify(activity.metadata).substring(0, 100)}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{formatDate(activity.createdAt)}</span>
                        <span>{formatTimeAgo(activity.createdAt)}</span>
                        {activity.ipAddress && <span className="hidden sm:inline">IP: {activity.ipAddress}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
