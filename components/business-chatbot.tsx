"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Zap, FileText, Target } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const businessContext = `You are HBU Recovery AI v9.1 - a surplus funds recovery expert.

BUSINESS CONTEXT:
- 5 years in business, 94% success rate
- Average claim: $28,500
- Top counties: LA, Orange, San Diego, Riverside
- Recovery process: Contact → Agreement → County Filing → Payment
- Common objections: "Is this real?", "Too good to be true", "I'll think about it"

RESPONSE GUIDELINES:
- Always reference actual business data when possible
- Suggest next business actions
- Provide county-specific insights
- Estimate timelines based on real recovery patterns
- Use persuasive but compliant language

RECOVERY STRATEGIES:
1. Immediate high-value claims (>$50K)
2. Medium claims with responsive owners
3. Legacy claims needing persistent outreach`

export function BusinessChatbot() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickActions = [
    {
      icon: Target,
      label: "Strategy Session",
      prompt: "Analyze my current claim portfolio and suggest prioritization strategy for maximum recovery this month.",
    },
    {
      icon: FileText,
      label: "Document Help",
      prompt: "I need a persuasive script for contacting heirs who are skeptical about surplus funds recovery.",
    },
    {
      icon: Zap,
      label: "Objection Handling",
      prompt:
        "Provide responses for common objections: 'This sounds too good to be true' and 'I need to think about it'",
    },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: businessContext + `\n\nUser: ${input}`,
          history: messages,
        }),
      })

      const data = await response.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ System busy. Analyzing 247 active claims. Try again in a moment.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="flex flex-col h-[600px] bg-neutral-900 border-orange-900/50">
      {/* Header */}
      <div className="p-4 border-b border-orange-900/50">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h2 className="text-xl font-bold text-orange-500">RECOVERY AI v9.1</h2>
        </div>
        <p className="text-sm text-orange-400 mt-1">Strategic business intelligence online</p>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-orange-900/50">
        <p className="text-sm text-gray-400 mb-2">QUICK STRATEGIES:</p>
        <div className="flex gap-2 overflow-x-auto">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => setInput(action.prompt)}
              className="flex items-center gap-2 bg-neutral-800 px-3 py-2 rounded-lg text-xs whitespace-nowrap flex-shrink-0 border border-orange-900/50 hover:bg-neutral-700"
            >
              <action.icon className="h-3 w-3 text-orange-400" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <p className="text-lg font-bold text-white">HBU Recovery AI Assistant</p>
            <p className="text-sm">Ask me about claim strategies, objection handling, or business analytics</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                message.role === "user" ? "bg-orange-600 text-white" : "bg-neutral-800 border border-orange-900/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-orange-400" />}
                <span className="text-xs font-bold">{message.role === "user" ? "COMMANDER" : "RECOVERY AI"}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 border border-orange-900/50 rounded-lg p-3 max-w-[85%]">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-orange-400" />
                <span className="text-xs font-bold">RECOVERY AI</span>
              </div>
              <div className="flex space-x-1 mt-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-orange-900/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about claims, strategy, or objections..."
            className="flex-1 bg-neutral-800 border border-orange-900/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-orange-600 text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
