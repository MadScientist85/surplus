import { Suspense } from "react"
import { getUserTeams } from "@/lib/actions"
import { TeamsContent } from "@/components/teams/teams-content"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

export default async function TeamsPage() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Teams</h1>
        <p className="text-muted-foreground">Collaborate with your team on asset recovery</p>
      </div>

      <Suspense fallback={<TeamsSkeleton />}>
        <TeamsLoader />
      </Suspense>
    </div>
  )
}

async function TeamsLoader() {
  const teams = await getUserTeams()
  return <TeamsContent initialTeams={teams} />
}

function TeamsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-32 bg-neutral-800" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 bg-neutral-800" />
        ))}
      </div>
    </div>
  )
}
