import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default async function ServerActionPage() {
  async function createComment(formData: FormData) {
    "use server"
    const comment = formData.get("comment") as string

    if (!comment || comment.trim() === "") return

    await sql`INSERT INTO test_comments (comment) VALUES (${comment})`
    revalidatePath("/db-test/action")
  }

  async function getComments() {
    // Create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS test_comments (
        id SERIAL PRIMARY KEY, 
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    const comments = await sql`
      SELECT * FROM test_comments 
      ORDER BY created_at DESC 
      LIMIT 10
    `
    return comments
  }

  const comments = await getComments()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-orange-500">Server Action Example</h1>
        <p className="text-gray-400">Testing data mutations with Next.js Server Actions</p>
      </div>

      <Card className="bg-neutral-900 border-orange-900/50">
        <CardHeader>
          <CardTitle className="text-white">Add Comment</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createComment} className="flex gap-2">
            <Input
              type="text"
              name="comment"
              placeholder="Enter a test comment..."
              className="bg-neutral-800 border-orange-900/50"
              required
            />
            <Button type="submit" className="bg-orange-600 hover:bg-orange-500">
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-neutral-900 border-orange-900/50">
        <CardHeader>
          <CardTitle className="text-white">Recent Comments ({comments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <p className="text-gray-400 text-sm">No comments yet. Add one above!</p>
          ) : (
            <ul className="space-y-2">
              {comments.map((c: any) => (
                <li key={c.id} className="bg-neutral-800 p-3 rounded border border-orange-900/30">
                  <p className="text-white">{c.comment}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
