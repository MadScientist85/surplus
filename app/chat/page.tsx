"use client"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Brain, Send, Zap } from "lucide-react"

export default function AIAgentChat() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; tools?: string[] }>>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const context = useRef<string[]>([])

  const send = async () => {
    if (!input.trim()) return

    setLoading(true)
    const userMessage = input
    setInput("")

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

    try {
      // Build context (last 10 exchanges + current)
      const fullContext = context.current.slice(-10).join("\n") + "\nUser: " + userMessage

      // Call MCP API
      const response = await fetch("/api/tools/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullContext }),
      })

      const data = await response.json()

      // Add assistant response
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.final_answer || data.response || "Task completed.",
          tools: data.tools_executed?.map((t: any) => t.tool),
        },
      ])

      // Update context
      context.current.push(`User: ${userMessage}`)
      context.current.push(`AI: ${data.final_answer || data.response}`)

      // Trim context if too large (keep last 20 exchanges)
      if (context.current.length > 40) {
        context.current = context.current.slice(-40)
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error executing command. Please try again.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <div className="p-6 border-b border-orange-900/50">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">HBU AI Agent</h1>
            <p className="text-sm text-neutral-400">1M+ token context • 20+ tools • 4 AI providers</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <Card className="bg-neutral-900 border-neutral-700 p-6">
            <p className="text-neutral-400 text-center">Command the empire. Execute tools. Automate everything.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="border-orange-900/50 bg-transparent"
                onClick={() => setInput("File claim for lead CL-2025-118 in Oklahoma County")}
              >
                File a claim
              </Button>
              <Button
                variant="outline"
                className="border-orange-900/50 bg-transparent"
                onClick={() => setInput("Skip trace all new leads from today")}
              >
                Skip trace leads
              </Button>
              <Button
                variant="outline"
                className="border-orange-900/50 bg-transparent"
                onClick={() => setInput("Send SMS to high priority leads")}
              >
                Send SMS campaign
              </Button>
              <Button
                variant="outline"
                className="border-orange-900/50 bg-transparent"
                onClick={() => setInput("Show me today's performance metrics")}
              >
                View metrics
              </Button>
            </div>
          </Card>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
            <div
              className={`inline-block p-4 rounded-lg max-w-2xl ${
                msg.role === "user"
                  ? "bg-orange-900/50 text-white"
                  : "bg-neutral-900 border border-neutral-700 text-white"
              }`}
            >
              {msg.content}

              {msg.tools && msg.tools.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.tools.map((tool, idx) => (
                    <Badge key={idx} variant="outline" className="border-orange-500 text-orange-500">
                      <Zap className="w-3 h-3 mr-1" />
                      {tool}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-left">
            <div className="inline-block p-4 rounded-lg bg-neutral-900 border border-neutral-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse delay-100" />
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-orange-900/50">
        <div className="flex gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Command the empire... (e.g., 'File all OK County claims over $20K')"
            className="bg-neutral-900 border-neutral-700 text-white resize-none"
            rows={3}
          />
          <Button
            onClick={send}
            disabled={loading || !input.trim()}
            className="bg-orange-600 hover:bg-orange-700 self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
