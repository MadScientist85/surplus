"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import * as Sentry from "@sentry/nextjs"

interface EmpireMetrics {
  totalLeads: number
  totalClaimValue: number
  activeStates: number
  bountyPaid: number
  projectedRevenue: number
  recoveryScore: number
}

export default function EmpireDashboardPage() {
  const [metrics, setMetrics] = useState<EmpireMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch("/api/dashboard/empire")
        if (!response.ok) throw new Error("Failed to fetch metrics")

        const data = await response.json()
        setMetrics(data)
      } catch (error) {
        Sentry.captureException(error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!metrics) {
    return <div className="p-6">Failed to load metrics</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Empire Dashboard</h1>
        <div className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleTimeString()}</div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-sm font-medium text-muted-foreground">Total Leads</div>
          <div className="text-3xl font-bold mt-2">{metrics.totalLeads.toLocaleString()}</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-muted-foreground">Total Claim Value</div>
          <div className="text-3xl font-bold mt-2">${(metrics.totalClaimValue / 1000000).toFixed(2)}M</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-muted-foreground">Active States</div>
          <div className="text-3xl font-bold mt-2">{metrics.activeStates}/50</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-muted-foreground">Bounty Paid</div>
          <div className="text-3xl font-bold mt-2">${metrics.bountyPaid.toLocaleString()}</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-muted-foreground">Projected Revenue (2027)</div>
          <div className="text-3xl font-bold mt-2">${(metrics.projectedRevenue / 1000000).toFixed(2)}M</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-muted-foreground">Recovery Score</div>
          <div className="text-3xl font-bold mt-2">{metrics.recoveryScore}/100</div>
        </Card>
      </div>

      {/* Revenue Projection */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Revenue Projection</h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>2025 (Current)</span>
            <span className="font-bold">$125K</span>
          </div>
          <div className="flex justify-between items-center">
            <span>2026 (20-State Expansion)</span>
            <span className="font-bold">$2.5M</span>
          </div>
          <div className="flex justify-between items-center">
            <span>2027 (50-State Full Scale)</span>
            <span className="font-bold text-primary">$8.75M</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
