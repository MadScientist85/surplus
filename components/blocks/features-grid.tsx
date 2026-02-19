"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Zap, Globe, Brain, FileText, TrendingUp, Lock, Workflow } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "TCPA 2025 Compliant",
    description: "Built-in compliance tools ensure every communication meets federal regulations.",
  },
  {
    icon: Brain,
    title: "AI-Powered Automation",
    description: "Smart workflows handle document generation, filing, and follow-ups automatically.",
  },
  {
    icon: Globe,
    title: "50-State Coverage",
    description: "Automated filings for surplus funds, 12(o), and unclaimed property across all states.",
  },
  {
    icon: Zap,
    title: "Advanced Skip Tracing",
    description: "Multi-source data enrichment finds hard-to-locate asset owners instantly.",
  },
  {
    icon: FileText,
    title: "Smart Document Generation",
    description: "Auto-fill state-specific forms with AI-extracted data from court records.",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Analytics",
    description: "Track recovery rates, ROI, and pipeline health with live dashboards.",
  },
  {
    icon: Lock,
    title: "Bank-Level Security",
    description: "End-to-end encryption and SOC 2 compliance protect sensitive data.",
  },
  {
    icon: Workflow,
    title: "Custom Workflows",
    description: "Build automated sequences for outreach, follow-up, and compliance checks.",
  },
]

export function FeaturesGrid() {
  return (
    <section className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Everything You Need to Scale</h2>
          <p className="text-lg text-muted-foreground">Purpose-built tools for asset recovery professionals</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="border-muted">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
