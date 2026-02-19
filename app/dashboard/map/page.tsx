"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import * as Sentry from "@sentry/nextjs"

interface StateData {
  state: string
  leads: number
  claimValue: number
  aruEnabled: boolean
  lastRun?: string
}

export default function ARUMapPage() {
  const [stateData, setStateData] = useState<StateData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedState, setSelectedState] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMapData() {
      try {
        const response = await fetch("/api/dashboard/map-data")
        if (!response.ok) throw new Error("Failed to fetch map data")

        const data = await response.json()
        setStateData(data.states)
      } catch (error) {
        Sentry.captureException(error)
      } finally {
        setLoading(false)
      }
    }

    fetchMapData()
    const interval = setInterval(fetchMapData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const selectedStateData = stateData.find((s) => s.state === selectedState)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">ARU Swarm Map</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* State List */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">States</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {stateData.map((state) => (
              <button
                key={state.state}
                onClick={() => setSelectedState(state.state)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  state.aruEnabled
                    ? "border-green-500 bg-green-50 dark:bg-green-950"
                    : "border-gray-300 bg-gray-50 dark:bg-gray-900"
                } ${selectedState === state.state ? "ring-2 ring-primary" : ""}`}
              >
                <div className="font-bold">{state.state}</div>
                <div className="text-xs text-muted-foreground">{state.leads} leads</div>
              </button>
            ))}
          </div>
        </Card>

        {/* State Details */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">State Details</h2>
          {selectedStateData ? (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">State</div>
                <div className="text-2xl font-bold">{selectedStateData.state}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Leads</div>
                <div className="text-xl font-bold">{selectedStateData.leads}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Claim Value</div>
                <div className="text-xl font-bold">${selectedStateData.claimValue.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">ARU Status</div>
                <div
                  className={`text-xl font-bold ${selectedStateData.aruEnabled ? "text-green-600" : "text-gray-500"}`}
                >
                  {selectedStateData.aruEnabled ? "Active" : "Inactive"}
                </div>
              </div>
              {selectedStateData.lastRun && (
                <div>
                  <div className="text-sm text-muted-foreground">Last Run</div>
                  <div className="text-sm">{new Date(selectedStateData.lastRun).toLocaleString()}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground">Select a state to view details</div>
          )}
        </Card>
      </div>
    </div>
  )
}
