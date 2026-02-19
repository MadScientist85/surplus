"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Play, Pause, Settings, MapPin, Trophy } from "lucide-react"

const agents = [
  {
    id: "AGT-001",
    name: "Skip Trace Alpha",
    status: "active",
    missions: 42,
    successRate: 94,
    location: "Miami-Dade, FL",
  },
  {
    id: "AGT-002",
    name: "Marketing Delta",
    status: "active",
    missions: 38,
    successRate: 87,
    location: "Orange County, CA",
  },
  {
    id: "AGT-003",
    name: "Cold Call Bravo",
    status: "active",
    missions: 156,
    successRate: 72,
    location: "Harris County, TX",
  },
  {
    id: "AGT-004",
    name: "SMS Omega",
    status: "active",
    missions: 892,
    successRate: 68,
    location: "Broward County, FL",
  },
  {
    id: "AGT-005",
    name: "Email Sigma",
    status: "active",
    missions: 1247,
    successRate: 81,
    location: "Cook County, IL",
  },
  {
    id: "AGT-006",
    name: "Scraper Gamma",
    status: "active",
    missions: 28,
    successRate: 96,
    location: "Maricopa County, AZ",
  },
  { id: "AGT-007", name: "Compliance Zeta", status: "active", missions: 15, successRate: 100, location: "Nationwide" },
  { id: "AGT-008", name: "Doc Gen Theta", status: "idle", missions: 67, successRate: 89, location: "All States" },
]

export function HBUAgentNetwork() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">AI Agent Network</h1>
        <p className="text-neutral-400">Monitor and control autonomous recovery agents</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
        <Input
          type="text"
          placeholder="Search agents by name, ID, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAgents.map((agent) => (
          <Card key={agent.id} className="bg-neutral-900 border-neutral-700 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">{agent.name}</h3>
                <p className="text-xs text-neutral-400">{agent.id}</p>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${
                  agent.status === "active" ? "border-green-500 text-green-500" : "border-neutral-500 text-neutral-500"
                }`}
              >
                {agent.status}
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs">
                <Trophy className="h-4 w-4 text-orange-500" />
                <span className="text-neutral-400">Missions:</span>
                <span className="text-white font-medium">{agent.missions}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-4 w-4 flex items-center justify-center text-orange-500 font-bold">%</div>
                <span className="text-neutral-400">Success Rate:</span>
                <span className="text-white font-medium">{agent.successRate}%</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="h-4 w-4 text-orange-500" />
                <span className="text-neutral-400 truncate">{agent.location}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-neutral-700 hover:bg-neutral-800 hover:text-white bg-transparent"
              >
                {agent.status === "active" ? (
                  <>
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Start
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-neutral-700 hover:bg-neutral-800 hover:text-white bg-transparent"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-400">No agents found matching your search.</p>
        </div>
      )}
    </div>
  )
}
