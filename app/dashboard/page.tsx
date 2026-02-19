import { Suspense } from "react"
import { getDashboardStats } from "@/lib/actions"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  return (
    <div className="p-4 pb-24 md:pb-6 space-y-6 max-w-7xl mx-auto">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardLoader />
      </Suspense>
    </div>
  )
}

async function DashboardLoader() {
  try {
    const stats = await getDashboardStats()
    return <DashboardContent stats={stats} />
  } catch (error) {
    // Return default stats if user not authenticated yet
    return (
      <DashboardContent
        stats={{
          totalLeads: 0,
          activeLeads: 0,
          recoveredLeads: 0,
          weeklyActivity: 0,
          totalRecovered: 0,
          successRate: 0,
          recentLeads: [],
        }}
      />
    )
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 bg-neutral-800" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 bg-neutral-800" />
        ))}
      </div>
      <Skeleton className="h-48 bg-neutral-800" />
    </div>
  )
}
