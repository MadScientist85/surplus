"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, FileText, CheckCircle, DollarSign, Calendar, Flag } from "lucide-react"

const stats = [
  { label: "Active Ops", value: "24", icon: Activity, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  { label: "Total Claims", value: "1,847", icon: FileText, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { label: "Completed", value: "142", icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-500/10" },
  { label: "Est. Value", value: "$8.7M", icon: DollarSign, color: "text-purple-500", bgColor: "bg-purple-500/10" },
]

const operations = [
  {
    title: "Miami-Dade Surplus Recovery",
    county: "Miami-Dade County, FL",
    status: "in-progress",
    priority: "high",
    claims: { completed: 34, total: 67 },
    deadline: "2025-01-18",
    value: "$1.2M",
  },
  {
    title: "Orange County Batch Q1",
    county: "Orange County, CA",
    status: "in-progress",
    priority: "medium",
    claims: { completed: 89, total: 142 },
    deadline: "2025-01-25",
    value: "$2.4M",
  },
  {
    title: "Harris County Tax Sale Recovery",
    county: "Harris County, TX",
    status: "review",
    priority: "high",
    claims: { completed: 12, total: 28 },
    deadline: "2025-01-15",
    value: "$890K",
  },
  {
    title: "Broward County Q4 Surplus",
    county: "Broward County, FL",
    status: "in-progress",
    priority: "low",
    claims: { completed: 156, total: 203 },
    deadline: "2025-02-01",
    value: "$3.1M",
  },
  {
    title: "Cook County Multi-Claim",
    county: "Cook County, IL",
    status: "planning",
    priority: "medium",
    claims: { completed: 0, total: 45 },
    deadline: "2025-01-30",
    value: "$670K",
  },
]

export function HBUOperations() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Operations</h1>
        <p className="text-neutral-400">Active recovery operations and claim tracking</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="bg-neutral-900 border-neutral-700 p-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Active Operations List */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Active Operations</h2>
        <div className="space-y-4">
          {operations.map((op, idx) => (
            <Card key={idx} className="bg-neutral-900 border-neutral-700 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{op.title}</h3>
                      <p className="text-sm text-neutral-400">{op.county}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        op.status === "in-progress"
                          ? "border-blue-500 text-blue-500"
                          : op.status === "review"
                            ? "border-yellow-500 text-yellow-500"
                            : "border-neutral-500 text-neutral-500"
                      }`}
                    >
                      {op.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        op.priority === "high"
                          ? "border-red-500 text-red-500"
                          : op.priority === "medium"
                            ? "border-yellow-500 text-yellow-500"
                            : "border-green-500 text-green-500"
                      }`}
                    >
                      <Flag className="h-3 w-3 mr-1" />
                      {op.priority}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-500" />
                      <span className="text-neutral-400">Claims:</span>
                      <span className="text-white font-medium">
                        {op.claims.completed}/{op.claims.total}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span className="text-neutral-400">Deadline:</span>
                      <span className="text-white font-medium">{op.deadline}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-orange-500" />
                      <span className="text-neutral-400">Value:</span>
                      <span className="text-white font-medium">{op.value}</span>
                    </div>
                  </div>

                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white whitespace-nowrap">
                    Manage
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                  <span>Progress</span>
                  <span>{Math.round((op.claims.completed / op.claims.total) * 100)}%</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${(op.claims.completed / op.claims.total) * 100}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
