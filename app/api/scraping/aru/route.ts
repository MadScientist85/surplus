import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"
import { AruSwarm } from "@/lib/scraping/aru-swarm"
import { QuantumPredictor } from "@/lib/ai/quantum-predictor"

const { logger } = Sentry

export async function POST(req: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/scraping/aru",
    },
    async () => {
      try {
        const { userId } = await auth()
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { state } = await req.json()

        const aruSwarm = new AruSwarm()
        const predictor = new QuantumPredictor()

        let leads
        if (state) {
          // Scrape specific state
          leads = await aruSwarm.scrapeState(state)
        } else {
          // Scrape all states
          leads = await aruSwarm.scrapeAllStates()
        }

        // Run predictions
        const predictions = await predictor.predictBatch(leads)

        // Filter and save high-value leads
        const highValueLeads = leads.filter((lead, index) => {
          const prediction = predictions[index]
          return prediction.recoveryProbability >= 0.7
        })

        const savedCount = await aruSwarm.saveLeads(highValueLeads)

        logger.info("ARU scrape completed via API", {
          userId,
          state: state || "all",
          leadsFound: leads.length,
          highValueLeads: highValueLeads.length,
          saved: savedCount,
        })

        return NextResponse.json({
          success: true,
          totalLeads: leads.length,
          highValueLeads: highValueLeads.length,
          saved: savedCount,
        })
      } catch (error) {
        logger.error("ARU scrape API failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        })

        Sentry.captureException(error)

        return NextResponse.json({ error: "Failed to scrape leads" }, { status: 500 })
      }
    },
  )
}

export async function GET(req: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/scraping/aru",
    },
    async () => {
      try {
        const { userId } = await auth()
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { prisma } = await import("@/lib/prisma")

        // Get recent ARU runs
        const runs = await prisma.aruRun.findMany({
          orderBy: { runAt: "desc" },
          take: 50,
        })

        return NextResponse.json({ runs })
      } catch (error) {
        logger.error("Failed to fetch ARU runs", {
          error: error instanceof Error ? error.message : "Unknown error",
        })

        Sentry.captureException(error)

        return NextResponse.json({ error: "Failed to fetch ARU runs" }, { status: 500 })
      }
    },
  )
}
