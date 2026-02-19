import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getTeam } from "@/lib/actions"
import { TeamDetails } from "@/components/teams/team-details"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

interface TeamPageProps {
  params: Promise<{ teamId: string }>
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { teamId } = await params

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <Suspense fallback={<TeamDetailsSkeleton />}>
        <TeamLoader teamId={teamId} />
      </Suspense>
    </div>
  )
}

async function TeamLoader({ teamId }: { teamId: string }) {
  const team = await getTeam(teamId)
  if (!team) return notFound()
  return <TeamDetails team={team} />
}

function TeamDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64 bg-neutral-800" />
      <Skeleton className="h-48 bg-neutral-800" />
      <Skeleton className="h-64 bg-neutral-800" />
    </div>
  )
}
