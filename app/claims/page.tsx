"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Filter, Search, AlertTriangle, CheckCircle, Clock, FileText, Shield } from "lucide-react"

// Mock data - replace with real Supabase data
const mockClaims = [
  {
    id: "1",
    owner: "John Smith",
    county: "Los Angeles",
    case_number: "CF-2024-001234",
    amount: 42500,
    status: "document_review",
    progress: 65,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    owner: "Maria Garcia",
    county: "Orange",
    case_number: "CF-2024-002156",
    amount: 31200,
    status: "contact_attempted",
    progress: 35,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    owner: "Robert Johnson",
    county: "San Diego",
    case_number: "CF-2024-003891",
    amount: 28700,
    status: "payment_pending",
    progress: 95,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default function ClaimTracker() {
  const [claims, setClaims] = useState(mockClaims)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  // Business logic: Auto-prioritize claims
  const prioritizedClaims = claims
    .map((claim) => ({
      ...claim,
      priority: calculatePriority(claim),
      nextAction: getNextAction(claim),
      estimatedClose: getEstimatedCloseDate(claim),
    }))
    .sort((a, b) => b.priority - a.priority)

  const filteredClaims = prioritizedClaims.filter(
    (claim) =>
      (filter === "all" || claim.status === filter) &&
      (claim.owner.toLowerCase().includes(search.toLowerCase()) ||
        claim.county.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div className="p-4 pb-24 md:pb-6 space-y-6 max-w-7xl mx-auto">
      {/* Mobile Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-orange-500">CLAIM ORACLE</h1>
          <p className="text-sm text-orange-400">{filteredClaims.length} active cases</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-neutral-800">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search claims..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-neutral-800 border-orange-900/50"
        />
      </div>

      {/* Priority Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-red-900/30 rounded p-3 text-center border border-red-900/50">
          <p className="text-xs text-red-400">HIGH</p>
          <p className="text-lg font-bold text-white">{prioritizedClaims.filter((c) => c.priority > 80).length}</p>
        </div>
        <div className="bg-orange-900/30 rounded p-3 text-center border border-orange-900/50">
          <p className="text-xs text-orange-400">MEDIUM</p>
          <p className="text-lg font-bold text-white">
            {prioritizedClaims.filter((c) => c.priority > 50 && c.priority <= 80).length}
          </p>
        </div>
        <div className="bg-green-900/30 rounded p-3 text-center border border-green-900/50">
          <p className="text-xs text-green-400">LOW</p>
          <p className="text-lg font-bold text-white">{prioritizedClaims.filter((c) => c.priority <= 50).length}</p>
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.map((claim) => (
          <ClaimCard key={claim.id} claim={claim} />
        ))}
      </div>
    </div>
  )
}

function ClaimCard({ claim }: { claim: any }) {
  return (
    <Card className="bg-neutral-900 border-orange-900/50 p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white truncate">{claim.owner}</h3>
            <PriorityBadge priority={claim.priority} />
          </div>
          <p className="text-sm text-orange-400">{claim.county}</p>
          <p className="text-xs text-gray-400">{claim.case_number}</p>
        </div>
        <StatusBadge status={claim.status} />
      </div>

      {/* Progress with business context */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Recovery Progress</span>
          <span className="text-white">{claim.progress}%</span>
        </div>
        <Progress value={claim.progress} className="h-2" />
        <p className="text-xs text-gray-400 mt-1">{claim.nextAction}</p>
      </div>

      {/* Financials */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-2xl font-bold text-green-400">${claim.amount.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Est. close: {claim.estimatedClose}</p>
        </div>
        <Button size="sm" className="bg-orange-600 text-xs">
          Take Action
        </Button>
      </div>
    </Card>
  )
}

// Business Intelligence Functions
function calculatePriority(claim: any): number {
  let priority = 50

  // Amount-based priority
  if (claim.amount > 50000) priority += 20
  else if (claim.amount > 25000) priority += 10

  // Age-based priority
  const claimAge = new Date().getTime() - new Date(claim.created_at).getTime()
  const daysOld = claimAge / (1000 * 3600 * 24)
  if (daysOld > 90) priority += 15
  else if (daysOld > 30) priority += 8

  // Status-based priority
  if (claim.status === "document_review") priority += 15
  if (claim.status === "contact_attempted") priority += 10

  return Math.min(100, priority)
}

function getNextAction(claim: any): string {
  const actions: Record<string, string> = {
    new: "Initial contact required",
    contact_attempted: "Follow-up call needed",
    document_review: "Review signed agreement",
    county_filing: "File with county clerk",
    payment_pending: "Awaiting county payment",
    paid: "Case complete - send thank you",
  }
  return actions[claim.status] || "Review case status"
}

function getEstimatedCloseDate(claim: any): string {
  const statusDays: Record<string, number> = {
    new: 45,
    contact_attempted: 35,
    document_review: 25,
    county_filing: 15,
    payment_pending: 5,
  }

  const daysToAdd = statusDays[claim.status] || 30
  const date = new Date()
  date.setDate(date.getDate() + daysToAdd)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function PriorityBadge({ priority }: { priority: number }) {
  if (priority > 80) return <Badge className="bg-red-500 text-xs">HIGH</Badge>
  if (priority > 50) return <Badge className="bg-orange-500 text-xs">MEDIUM</Badge>
  return <Badge className="bg-green-500 text-xs">LOW</Badge>
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { bg: string; icon: any }> = {
    new: { bg: "bg-blue-500", icon: Clock },
    contact_attempted: { bg: "bg-orange-500", icon: AlertTriangle },
    document_review: { bg: "bg-purple-500", icon: FileText },
    county_filing: { bg: "bg-yellow-500", icon: Shield },
    payment_pending: { bg: "bg-green-500", icon: CheckCircle },
    paid: { bg: "bg-gray-500", icon: CheckCircle },
  }

  const config = variants[status] || variants["new"]
  const Icon = config.icon

  return (
    <Badge className={`${config.bg} text-xs flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {status.replace("_", " ").toUpperCase()}
    </Badge>
  )
}
