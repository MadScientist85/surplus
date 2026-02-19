"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Ban } from "lucide-react"

export default function ComplianceDashboard() {
  const [stats, setStats] = useState({
    complianceRate: 99.9,
    violationsToday: 0,
    totalScans: 1247,
    ethicsNFTs: 856,
    optOuts: 23,
    activeBlocks: 12,
  })

  const [recentScans, setRecentScans] = useState([
    { id: 1, lead: "John Smith", action: "SMS", status: "passed", time: "2 min ago" },
    { id: 2, lead: "Maria Garcia", action: "Email", status: "passed", time: "5 min ago" },
    { id: 3, lead: "Robert Johnson", action: "SMS", status: "blocked", reason: "DNC_FEDERAL", time: "12 min ago" },
  ])

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-orange-500">COMPLIANCE FORTRESS</h1>
          <p className="text-sm text-orange-400">TCPA | FDCPA | State Laws | 100% Protected</p>
        </div>
        <Badge className="bg-green-500 text-white flex items-center gap-2 px-4 py-2">
          <Shield className="h-4 w-4" />
          ACTIVE
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-neutral-900 border-green-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-4xl font-bold text-green-400">{stats.complianceRate}%</p>
                <p className="text-sm text-gray-400">Compliance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-red-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-4xl font-bold text-red-400">{stats.violationsToday}</p>
                <p className="text-sm text-gray-400">Violations Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-blue-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-4xl font-bold text-blue-400">{stats.ethicsNFTs}</p>
                <p className="text-sm text-gray-400">Ethics NFTs Minted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-orange-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-orange-400" />
              <div>
                <p className="text-4xl font-bold text-orange-400">{stats.totalScans}</p>
                <p className="text-sm text-gray-400">Scans This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-yellow-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Ban className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-4xl font-bold text-yellow-400">{stats.optOuts}</p>
                <p className="text-sm text-gray-400">Opt-Outs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-purple-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-4xl font-bold text-purple-400">{stats.activeBlocks}</p>
                <p className="text-sm text-gray-400">Active Blocks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Progress */}
      <Card className="bg-neutral-900 border-orange-900/50">
        <CardHeader>
          <CardTitle className="text-white">Monthly Compliance Target</CardTitle>
          <CardDescription>99.5% target for legal protection</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={stats.complianceRate} className="h-4 mb-2" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{stats.totalScans} scans</span>
            <span className="text-green-400">{stats.complianceRate}% compliant</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Scans */}
      <Card className="bg-neutral-900 border-orange-900/50">
        <CardHeader>
          <CardTitle className="text-white">Real-Time Compliance Scans</CardTitle>
          <CardDescription>Live monitoring of all outreach</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentScans.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg border border-orange-900/30"
              >
                <div className="flex items-center gap-3">
                  {scan.status === "passed" ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  )}
                  <div>
                    <p className="text-white font-medium">{scan.lead}</p>
                    <p className="text-xs text-gray-400">
                      {scan.action} • {scan.time}
                    </p>
                  </div>
                </div>
                <Badge variant={scan.status === "passed" ? "default" : "destructive"}>
                  {scan.status === "passed" ? "PASSED" : scan.reason}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Rules */}
      <Card className="bg-neutral-900 border-orange-900/50">
        <CardHeader>
          <CardTitle className="text-white">Active Compliance Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <ComplianceRule icon={CheckCircle} text="TCPA: 8AM-9PM local time window enforced" status="active" />
            <ComplianceRule icon={CheckCircle} text="DNC: Federal registry scrubbing active" status="active" />
            <ComplianceRule icon={CheckCircle} text="FDCPA: Litigation status checked" status="active" />
            <ComplianceRule
              icon={CheckCircle}
              text="State Laws: FL §45.032, OK 12 O.S. §772 compliant"
              status="active"
            />
            <ComplianceRule icon={CheckCircle} text="Opt-Out: Automatic STOP handling" status="active" />
            <ComplianceRule icon={CheckCircle} text="Ethics NFT: Minted on every compliant outreach" status="active" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ComplianceRule({ icon: Icon, text, status }: { icon: any; text: string; status: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg border border-green-900/30">
      <Icon className="h-5 w-5 text-green-400" />
      <p className="text-sm text-white flex-1">{text}</p>
      <Badge className="bg-green-500 text-white text-xs">{status.toUpperCase()}</Badge>
    </div>
  )
}
