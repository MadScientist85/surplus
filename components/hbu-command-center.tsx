"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Shield,
  FileText,
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { SovereignCommand } from "@/components/sovereign-command"
import { ToolStatusOracle } from "@/components/tool-status-oracle"

const agents = [
  { name: "Skip Trace", icon: Search, status: "active", missions: 42 },
  { name: "Marketing", icon: TrendingUp, status: "active", missions: 38 },
  { name: "Cold Call", icon: Phone, status: "active", missions: 156 },
  { name: "SMS", icon: MessageSquare, status: "active", missions: 892 },
  { name: "Email", icon: Mail, status: "active", missions: 1247 },
  { name: "Scraping", icon: Activity, status: "active", missions: 28 },
  { name: "Compliance", icon: Shield, status: "active", missions: 15 },
  { name: "Doc Generator", icon: FileText, status: "idle", missions: 67 },
]

const recentActivity = [
  { action: "Skip trace completed for Miami-Dade County", time: "2m ago", type: "success" },
  { action: "SMS campaign launched - 47 contacts", time: "8m ago", type: "info" },
  { action: "Compliance check passed for CA batch", time: "15m ago", type: "success" },
  { action: "Email bounce rate spike detected", time: "23m ago", type: "warning" },
  { action: "Cold call agent achieved 72% success rate", time: "31m ago", type: "success" },
]

const alerts = [
  { message: "DNC scrubbing scheduled for tomorrow 9 AM", priority: "medium" },
  { message: "3 operations approaching deadline", priority: "high" },
  { message: "Marketing budget 80% utilized", priority: "medium" },
]

export function HBUCommandCenter() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Command Center</h1>
        <p className="text-neutral-400">Real-time tactical overview of all HBU operations</p>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Total Recovered</p>
              <p className="text-2xl font-bold text-white">$2.4M</p>
            </div>
          </div>
          <p className="text-xs text-green-500">+12% from last month</p>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Target className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Success Rate</p>
              <p className="text-2xl font-bold text-white">68%</p>
            </div>
          </div>
          <p className="text-xs text-neutral-400">Industry avg: 42%</p>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Contacts</p>
              <p className="text-2xl font-bold text-white">1,247</p>
            </div>
          </div>
          <p className="text-xs text-blue-500">+89 this week</p>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Avg Days</p>
              <p className="text-2xl font-bold text-white">4.2</p>
            </div>
          </div>
          <p className="text-xs text-purple-500">-1.3 days improved</p>
        </Card>
      </div>

      {/* Agent Status Grid */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Agent Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {agents.map((agent) => {
            const Icon = agent.icon
            return (
              <Card key={agent.name} className="bg-neutral-900 border-neutral-700 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Icon className="h-5 w-5 text-orange-500" />
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      agent.status === "active"
                        ? "border-green-500 text-green-500"
                        : "border-neutral-500 text-neutral-500"
                    }`}
                  >
                    {agent.status}
                  </Badge>
                </div>
                <h3 className="text-sm font-medium text-white mb-1">{agent.name}</h3>
                <p className="text-xs text-neutral-400">{agent.missions} missions</p>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-neutral-900 border-neutral-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-800/50">
                {activity.type === "success" && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />}
                {activity.type === "warning" && (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                )}
                {activity.type === "info" && <Activity className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{activity.action}</p>
                  <p className="text-xs text-neutral-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* System Alerts */}
        <Card className="bg-neutral-900 border-neutral-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">System Alerts</h2>
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  alert.priority === "high"
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-yellow-500/10 border-yellow-500/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`h-5 w-5 flex-shrink-0 ${
                      alert.priority === "high" ? "text-red-500" : "text-yellow-500"
                    }`}
                  />
                  <p className="text-sm text-white flex-1">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Sovereign Command Interface and Tool Status Oracle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SovereignCommand />
        <ToolStatusOracle />
      </div>
    </div>
  )
}
