"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  MessageSquare,
  Zap,
  CheckCircle,
  Target,
  Activity,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface DashboardStats {
  totalLeads: number
  activeLeads: number
  recoveredLeads: number
  weeklyActivity: number
  totalRecovered: number | { toNumber?: () => number } | null
  successRate: number
  recentLeads: any[]
}

interface DashboardContentProps {
  stats: DashboardStats
}

export function DashboardContent({ stats }: DashboardContentProps) {
  // Handle Decimal type from Prisma
  const totalRecoveredValue =
    typeof stats.totalRecovered === "object" && stats.totalRecovered?.toNumber
      ? stats.totalRecovered.toNumber()
      : (stats.totalRecovered as number) || 0

  return (
    <>
      <div className="relative bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-xl p-6 border border-orange-900/50 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <Image src="/images/dashboard-hero-mobile.jpg" alt="Command Center" fill className="object-cover" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">COMMAND CENTER</h1>
          <p className="text-orange-400 text-sm">HBU Recovery Dashboard - Live Data</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-green-400">Connected to database</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={DollarSign}
          label="Total Recovered"
          value={`$${(totalRecoveredValue / 1000).toFixed(1)}K`}
          trend="Lifetime"
          color="text-green-400"
        />
        <StatCard icon={Target} label="Total Leads" value={stats.totalLeads} trend="All time" color="text-blue-400" />
        <StatCard
          icon={Activity}
          label="Active Leads"
          value={stats.activeLeads}
          trend="In pipeline"
          color="text-orange-400"
        />
        <StatCard
          icon={CheckCircle}
          label="Recovered"
          value={stats.recoveredLeads}
          trend="Completed"
          color="text-green-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Success Rate"
          value={`${stats.successRate}%`}
          trend="Conversion"
          color="text-purple-400"
        />
        <StatCard
          icon={Zap}
          label="Weekly Activity"
          value={stats.weeklyActivity}
          trend="Actions"
          color="text-yellow-400"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3">QUICK ACTIONS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <ActionButton
            icon={MessageSquare}
            title="Bulk SMS Campaign"
            description="Contact high-value leads"
            color="bg-blue-600"
            href="/dashboard/outreach"
          />
          <ActionButton
            icon={Zap}
            title="AI Strategy Session"
            description="Optimize recovery pipeline"
            color="bg-green-600"
            href="/dashboard/chat"
          />
          <ActionButton
            icon={FileText}
            title="View All Claims"
            description="Manage your leads"
            color="bg-purple-600"
            href="/dashboard/claims"
          />
          <ActionButton
            icon={TrendingUp}
            title="Analytics"
            description="View recovery metrics"
            color="bg-orange-600"
            href="/dashboard/analytics"
          />
        </div>
      </div>

      {/* Recent Leads */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">RECENT LEADS</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/claims">View All</Link>
          </Button>
        </div>
        <Card className="bg-neutral-900 border-orange-900/50">
          <CardContent className="p-4">
            {stats.recentLeads.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No leads yet</p>
                <Button className="mt-4 bg-orange-600 hover:bg-orange-500" asChild>
                  <Link href="/dashboard/claims/new">Create Your First Lead</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentLeads.map((lead: any) => (
                  <div
                    key={lead.id}
                    className="flex justify-between items-center pb-3 border-b border-orange-900/30 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-white">{lead.name || lead.claimantName}</p>
                      <p className="text-sm text-muted-foreground">
                        {lead.county ? `${lead.county}, ` : ""}
                        {lead.state}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">${Number(lead.claimAmount || 0).toLocaleString()}</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {lead.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickLink href="/dashboard/settings" label="Settings" icon={Users} />
        <QuickLink href="/dashboard/teams" label="Teams" icon={Users} />
        <QuickLink href="/dashboard/api-keys" label="API Keys" icon={Zap} />
        <QuickLink href="/dashboard/activity" label="Activity" icon={Activity} />
      </div>
    </>
  )
}

function StatCard({ icon: Icon, label, value, trend, color }: any) {
  return (
    <Card className="bg-neutral-900 border-orange-900/50">
      <CardContent className="p-3">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <Icon className="h-5 w-5 text-orange-500" />
            <p className={`text-lg md:text-xl font-bold ${color}`}>{value}</p>
          </div>
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <p className="text-xs text-gray-500">{trend}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ActionButton({ icon: Icon, title, description, color, href }: any) {
  return (
    <Button asChild className={`w-full justify-start text-left h-auto py-4 ${color} hover:opacity-90`}>
      <Link href={href}>
        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-bold text-sm">{title}</p>
          <p className="text-xs opacity-90">{description}</p>
        </div>
      </Link>
    </Button>
  )
}

function QuickLink({ href, label, icon: Icon }: any) {
  return (
    <Button variant="outline" asChild className="h-auto py-4 justify-start bg-transparent">
      <Link href={href}>
        <Icon className="h-4 w-4 mr-2" />
        {label}
      </Link>
    </Button>
  )
}
