import { Suspense } from "react"
import { getUserActivity } from "@/lib/actions"
import { ActivityContent } from "@/components/activity/activity-content"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

export default async function ActivityPage() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Activity Log</h1>
        <p className="text-muted-foreground">Track all your account activity</p>
      </div>

      <Suspense fallback={<ActivitySkeleton />}>
        <ActivityLoader />
      </Suspense>
    </div>
  )
}

async function ActivityLoader() {
  const activities = await getUserActivity({ limit: 100 })
  return <ActivityContent activities={activities} />
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-16 bg-neutral-800" />
      ))}
    </div>
  )
}
