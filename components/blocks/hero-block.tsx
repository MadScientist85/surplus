"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Zap, TrendingUp } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function HeroBlock() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/dashboard-hero.jpg"
          alt="Command Center Background"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-500/50 bg-black/50 px-4 py-2 text-sm backdrop-blur-sm">
            <Shield className="h-4 w-4 text-orange-500" />
            <span className="text-orange-100">TCPA 2025 Compliant • AI-Powered Recovery</span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Recover Assets at
            <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent"> Scale</span>
          </h1>

          {/* Subheadline */}
          <p className="mb-10 text-lg text-gray-300 sm:text-xl">
            HBU Recovery automates surplus funds, unclaimed property, and 12(o) filings across all 50 states. Built for
            compliance, powered by AI.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2 bg-orange-600 hover:bg-orange-500" asChild>
              <Link href="/dashboard">
                Start Recovery <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-500/10 bg-transparent"
              asChild
            >
              <Link href="/claims">View Claims</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20 border border-orange-500/50">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-white">$2.4M+</div>
              <div className="text-sm text-gray-400">Assets Recovered</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20 border border-orange-500/50">
                <Zap className="h-6 w-6 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-white">50 States</div>
              <div className="text-sm text-gray-400">Full Coverage</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20 border border-orange-500/50">
                <Shield className="h-6 w-6 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-sm text-gray-400">TCPA Compliant</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
