"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Terminal, Send, Zap } from "lucide-react"

type Message = {
  role: "user" | "assistant" | "system"
  content: string
  tools?: Array<{ tool: string; args: any; result: any }>
  timestamp: Date
}

export function SovereignCommand() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: "🚀 HBU Command Center Online. Tool calling enabled.",
      timestamp: new Date(),
    },
  ])
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)

  const executeCommand = async () => {
    if (!prompt.trim()) return

    const userMessage: Message = {
      role: "user",
      content: prompt,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setPrompt("")
    setLoading(true)

    try {
      const response = await fetch("/api/tools/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      const result = await response.json()

      const assistantMessage: Message = {
        role: "assistant",
        content: result.final_answer || result.response || "Command executed.",
        tools: result.tools_executed,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `❌ Error: ${(error as Error).message}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-neutral-900 border-neutral-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Terminal className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-bold">Sovereign Command Interface</h3>
        <Badge variant="outline" className="ml-auto">
          <Zap className="w-3 h-3 mr-1" />
          MCP Active
        </Badge>
      </div>

      <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded ${
              msg.role === "user"
                ? "bg-neutral-800 ml-8"
                : msg.role === "assistant"
                  ? "bg-neutral-800/50 mr-8"
                  : "bg-orange-500/10 border border-orange-500/20"
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-xs text-gray-400">
                {msg.role === "user" ? "YOU" : msg.role === "assistant" ? "HBU AI" : "SYSTEM"}
              </span>
              <span className="text-xs text-gray-500">{msg.timestamp.toLocaleTimeString()}</span>
            </div>
            <p className="text-sm">{msg.content}</p>

            {msg.tools && msg.tools.length > 0 && (
              <div className="mt-2 space-y-1">
                {msg.tools.map((tool, j) => (
                  <Badge key={j} variant="outline" className="text-xs bg-orange-500/10">
                    <Zap className="w-3 h-3 mr-1" />
                    {tool.tool}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && executeCommand()}
          placeholder="Enter command (e.g., 'File claim for lead CL-2025-118 in OK')"
          className="bg-neutral-800 border-neutral-700"
          disabled={loading}
        />
        <Button onClick={executeCommand} disabled={loading} className="bg-orange-500 hover:bg-orange-600">
          <Send className="w-4 h-4" />
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-400">
        <div>💡 "Skip trace lead CL-123"</div>
        <div>💡 "File all OK County claims"</div>
        <div>💡 "Check DNC for 555-0100"</div>
      </div>
    </Card>
  )
}
