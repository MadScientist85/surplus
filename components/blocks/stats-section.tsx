"use client"

import { TrendingUp, Users, DollarSign, Award } from "lucide-react"

const stats = [
  {
    icon: DollarSign,
    value: "$2.4M+",
    label: "Assets Recovered",
    description: "Total value recovered for clients in 2024",
  },
  {
    icon: Users,
    value: "1,247",
    label: "Active Claims",
    description: "Currently processing across all states",
  },
  {
    icon: TrendingUp,
    value: "94%",
    label: "Success Rate",
    description: "Of claims successfully recovered",
  },
  {
    icon: Award,
    value: "50",
    label: "States Covered",
    description: "Full nationwide compliance coverage",
  },
]

export function StatsSection() {
  return (
    <section className="py-20 sm:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="mb-2 text-4xl font-bold tracking-tight">{stat.value}</div>
                <div className="mb-1 text-lg font-semibold">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.description}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
