import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

async function getDbVersion() {
  const result = await sql`SELECT version()`
  return result[0].version as string
}

async function getDbStats() {
  const result = await sql`
    SELECT 
      current_database() as database,
      current_user as user,
      inet_server_addr() as server_ip,
      inet_server_port() as server_port
  `
  return result[0]
}

export default async function DatabaseTestPage() {
  const version = await getDbVersion()
  const stats = await getDbStats()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-orange-500">Neon Database Connection</h1>
        <p className="text-gray-400">Testing direct SQL queries with @neondatabase/serverless</p>
      </div>

      <Card className="bg-neutral-900 border-orange-900/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            Connection Status
          </CardTitle>
          <CardDescription>Successfully connected to Neon Postgres</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">PostgreSQL Version</p>
            <p className="text-sm text-white font-mono bg-black p-3 rounded border border-orange-900/30">{version}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Database</p>
              <Badge variant="outline" className="font-mono">
                {stats.database}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">User</p>
              <Badge variant="outline" className="font-mono">
                {stats.user}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-neutral-900 border-orange-900/50">
        <CardHeader>
          <CardTitle className="text-white">About @neondatabase/serverless</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-300">
          <p>✅ Optimized for Vercel Edge & Serverless Functions</p>
          <p>✅ Uses HTTP connections (no traditional PostgreSQL protocol)</p>
          <p>✅ Low latency with connection pooling built-in</p>
          <p>✅ Perfect for Next.js Server Components and API Routes</p>
        </CardContent>
      </Card>
    </div>
  )
}
