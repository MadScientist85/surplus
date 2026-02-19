"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Activity, CheckCircle, XCircle, Clock } from "lucide-react"

type ToolExecution = {
  id: string
  toolName: string
  success: boolean
  duration: number
  timestamp: Date
}

export function ToolStatusOracle() {
  const [executions, setExecutions] = useState<ToolExecution[]>([])
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    avgDuration: 0,
  })

  useEffect(() => {
    // Fetch recent tool executions
    fetch("/api/tools/recent")
      .then((res) => res.json())
      .then((data) => {
        setExecutions(data.executions || [])
        setStats(data.stats || stats)
      })
  }, [])

  return (
    <Card className="bg-neutral-900 border-neutral-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-bold">Tool Execution Oracle</h3>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-neutral-800 p-3 rounded">
          <p className="text-xs text-gray-400">Total Executions</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-500/10 p-3 rounded">
          <p className="text-xs text-gray-400">Success</p>
          <p className="text-2xl font-bold text-green-500">{stats.success}</p>
        </div>
        <div className="bg-red-500/10 p-3 rounded">
          <p className="text-xs text-gray-400">Failed</p>
          <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
        </div>
        <div className="bg-neutral-800 p-3 rounded">
          <p className="text-xs text-gray-400">Avg Duration</p>
          <p className="text-2xl font-bold">{stats.avgDuration}ms</p>
        </div>
      </div>

      <div className="space-y-2">
        {executions.slice(0, 10).map((exec) => (
          <div key={exec.id} className="flex items-center justify-between p-2 bg-neutral-800 rounded">
            <div className="flex items-center gap-2">
              {exec.success ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-mono">{exec.toolName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {exec.duration}ms
              <span>{new Date(exec.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
