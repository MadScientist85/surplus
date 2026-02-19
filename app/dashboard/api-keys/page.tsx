import { Suspense } from "react"
import { getUserApiKeys } from "@/lib/actions"
import { ApiKeysContent } from "@/components/api-keys/api-keys-content"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

export default async function ApiKeysPage() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">API Keys</h1>
        <p className="text-muted-foreground">Manage your API keys for programmatic access</p>
      </div>

      <Suspense fallback={<ApiKeysSkeleton />}>
        <ApiKeysLoader />
      </Suspense>
    </div>
  )
}

async function ApiKeysLoader() {
  const apiKeys = await getUserApiKeys()
  return <ApiKeysContent initialKeys={apiKeys} />
}

function ApiKeysSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-32 bg-neutral-800" />
      <Skeleton className="h-32 bg-neutral-800" />
      <Skeleton className="h-32 bg-neutral-800" />
    </div>
  )
}
