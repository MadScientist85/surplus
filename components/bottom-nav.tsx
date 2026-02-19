"use client"

import { Home, Target, Bot, Zap, BarChart3 } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-orange-900/50 z-50">
      <div className="flex justify-around items-center h-16">
        <NavItem href="/" icon={Home} active={pathname === "/"} label="Home" />
        <NavItem href="/claims" icon={Target} active={pathname === "/claims"} label="Claims" />
        <NavItem href="/chat" icon={Bot} active={pathname === "/chat"} label="AI" />
        <NavItem href="/outreach" icon={Zap} active={pathname === "/outreach"} label="Outreach" />
        <NavItem href="/analytics" icon={BarChart3} active={pathname === "/analytics"} label="Stats" />
      </div>
    </div>
  )
}

function NavItem({ href, icon: Icon, active, label }: any) {
  return (
    <Link href={href}>
      <div className={`flex flex-col items-center p-2 ${active ? "text-orange-500" : "text-gray-400"}`}>
        <Icon className="h-6 w-6" />
        <span className="text-xs mt-1">{label}</span>
      </div>
    </Link>
  )
}
