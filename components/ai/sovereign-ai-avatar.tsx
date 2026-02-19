"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Bot, Sparkles } from "lucide-react"

export function SovereignAIAvatar() {
  return (
    <Card className="bg-gradient-to-br from-orange-950/50 to-black border-orange-500/30">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Image
              src="/images/sovereign-ai-avatar.jpg"
              alt="Sovereign AI"
              width={80}
              height={80}
              className="rounded-full border-2 border-orange-500"
            />
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-orange-500" />
              Sovereign AI v2
            </h3>
            <p className="text-sm text-gray-400">Advanced Financial Recovery Assistant</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">Online & Ready</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
