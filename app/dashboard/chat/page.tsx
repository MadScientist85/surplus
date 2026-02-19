import { SovereignAIAvatar } from "@/components/ai/sovereign-ai-avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ChatPage() {
  return (
    <div className="p-4 pb-24 md:pb-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">SOVEREIGN AI CHAT</h1>
        <p className="text-gray-400">Advanced AI-powered recovery strategy assistant</p>
      </div>

      <SovereignAIAvatar />

      <Card className="bg-neutral-900 border-orange-900/50">
        <CardHeader>
          <CardTitle>AI Chat Interface</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chat interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}
