import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-orange-500/20 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80">
        <div className="container flex h-16 items-center justify-between">
          <Logo variant="full" size="sm" href="/" />

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/#features"
              className="text-sm font-medium text-neutral-300 hover:text-orange-500 transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-medium text-neutral-300 hover:text-orange-500 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/compliance"
              className="text-sm font-medium text-neutral-300 hover:text-orange-500 transition-colors"
            >
              Compliance
            </Link>
            <Link href="/#faq" className="text-sm font-medium text-neutral-300 hover:text-orange-500 transition-colors">
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-neutral-300 hover:text-orange-500 hover:bg-orange-500/10" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button className="bg-orange-500 text-white hover:bg-orange-600" asChild>
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {children}

      <footer className="border-t border-orange-500/20 bg-neutral-950">
        <div className="container py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Logo variant="icon" size="md" className="mb-4" />
              <p className="text-sm text-neutral-400 leading-relaxed">
                AI-powered asset recovery platform for surplus funds, unclaimed property, and compliance management.
              </p>
              <p className="text-xs text-orange-500 mt-3 font-semibold">5-YEARS TRUSTED SERVICE</p>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-neutral-300">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/#features" className="text-neutral-400 hover:text-orange-500">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/#pricing" className="text-neutral-400 hover:text-orange-500">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/claims" className="text-neutral-400 hover:text-orange-500">
                    Claims
                  </Link>
                </li>
                <li>
                  <Link href="/analytics" className="text-neutral-400 hover:text-orange-500">
                    Analytics
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-neutral-300">Compliance</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/compliance" className="text-neutral-400 hover:text-orange-500">
                    TCPA Guidelines
                  </Link>
                </li>
                <li>
                  <Link href="/compliance" className="text-neutral-400 hover:text-orange-500">
                    FDCPA Standards
                  </Link>
                </li>
                <li>
                  <Link href="/compliance" className="text-neutral-400 hover:text-orange-500">
                    State Laws
                  </Link>
                </li>
                <li>
                  <Link href="/compliance" className="text-neutral-400 hover:text-orange-500">
                    Ethics NFT
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-neutral-300">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/#faq" className="text-neutral-400 hover:text-orange-500">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/#contact" className="text-neutral-400 hover:text-orange-500">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="text-neutral-400 hover:text-orange-500">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="text-neutral-400 hover:text-orange-500">
                    API
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-orange-500/20 pt-8 text-center text-sm text-neutral-400">
            <p>&copy; {new Date().getFullYear()} HBU Recovery. All rights reserved.</p>
            <p className="mt-2 text-orange-500 font-medium">
              TCPA 2025 Compliant • FDCPA Standards • 50-State Coverage
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
