import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ClerkProvider } from "@clerk/nextjs"
import { MobileNav } from "@/components/mobile-nav"
import { BottomNav } from "@/components/bottom-nav"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HBU Asset Recovery - 5-Years Trusted Service",
  description:
    "Professional asset recovery services for surplus funds, unclaimed property, and compliance management across all 50 states.",
  generator: "v0.app",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: [
      { url: "/logo/hbu-icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/logo/hbu-icon.svg",
    shortcut: "/logo/hbu-icon.svg",
  },
  openGraph: {
    title: "HBU Asset Recovery - 5-Years Trusted Service",
    description: "Professional asset recovery services across all 50 states",
    images: [
      {
        url: "/images/social-banner.jpg",
        width: 1500,
        height: 500,
        alt: "HBU Asset Recovery - Professional Service",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HBU Asset Recovery - 5-Years Trusted Service",
    description: "Professional asset recovery services across all 50 states",
    images: ["/images/social-banner.jpg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isDevelopment = process.env.NODE_ENV === "development"

  return (
    <ClerkProvider dynamic publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en">
        <body className="bg-black text-white font-sans antialiased">
          <div className="flex min-h-screen">
            <MobileNav />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
          </div>
          <BottomNav />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
