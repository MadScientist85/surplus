"use client"

import { useState } from "react"
import { Menu, X, Home, Target, Bot, Zap, BarChart3, Shield, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 bg-black border-b border-orange-500/30 z-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/dashboard">
            <Logo variant="wordmark" size="sm" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="text-white hover:text-orange-500 hover:bg-orange-500/10"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Spacer for fixed header on mobile */}
      <div className="md:hidden h-16" />

      <aside className="hidden md:block w-64 bg-neutral-950 border-r border-orange-500/20 min-h-screen">
        <div className="p-6 border-b border-orange-500/20">
          <Link href="/dashboard">
            <Logo variant="full" size="sm" />
          </Link>
          <p className="text-xs text-orange-500 mt-2 font-semibold tracking-wider">5-YEARS TRUSTED SERVICE</p>
        </div>
        <nav className="p-4 space-y-2">
          <NavLink href="/" icon={Home}>
            Command Center
          </NavLink>
          <NavLink href="/claims" icon={Target}>
            Claim Tracker
          </NavLink>
          <NavLink href="/chat" icon={Bot}>
            Sovereign AI
          </NavLink>
          <NavLink href="/outreach" icon={Zap}>
            Outreach
          </NavLink>
          <NavLink href="/analytics" icon={BarChart3}>
            Analytics
          </NavLink>
          <NavLink href="/compliance" icon={Shield}>
            Compliance
          </NavLink>
          <NavLink href="/settings" icon={Settings}>
            Settings
          </NavLink>
        </nav>
      </aside>

      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black/90 z-40" onClick={() => setIsOpen(false)}>
          <div
            className="fixed left-0 top-16 bottom-0 w-72 bg-neutral-950 border-r border-orange-500/30 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="p-4 space-y-2">
              <NavLink href="/" icon={Home} onClick={() => setIsOpen(false)}>
                Command Center
              </NavLink>
              <NavLink href="/claims" icon={Target} onClick={() => setIsOpen(false)}>
                Claim Tracker
              </NavLink>
              <NavLink href="/chat" icon={Bot} onClick={() => setIsOpen(false)}>
                Sovereign AI
              </NavLink>
              <NavLink href="/outreach" icon={Zap} onClick={() => setIsOpen(false)}>
                Outreach
              </NavLink>
              <NavLink href="/analytics" icon={BarChart3} onClick={() => setIsOpen(false)}>
                Analytics
              </NavLink>
              <NavLink href="/compliance" icon={Shield} onClick={() => setIsOpen(false)}>
                Compliance
              </NavLink>
              <NavLink href="/settings" icon={Settings} onClick={() => setIsOpen(false)}>
                Settings
              </NavLink>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

function NavLink({ href, icon: Icon, children, onClick }: any) {
  return (
    <Link href={href} onClick={onClick}>
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-300 hover:bg-orange-500/20 hover:text-orange-500 transition-colors group">
        <Icon className="h-5 w-5 text-orange-500 group-hover:text-orange-400" />
        <span className="text-sm font-medium">{children}</span>
      </div>
    </Link>
  )
}
