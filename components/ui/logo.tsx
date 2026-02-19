"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "full" | "icon" | "wordmark"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  href?: string
}

const sizeMap = {
  full: {
    sm: { width: 160, height: 48 },
    md: { width: 200, height: 60 },
    lg: { width: 280, height: 84 },
    xl: { width: 400, height: 120 },
  },
  icon: {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 },
  },
  wordmark: {
    sm: { width: 150, height: 25 },
    md: { width: 200, height: 33 },
    lg: { width: 250, height: 42 },
    xl: { width: 300, height: 50 },
  },
}

export function Logo({ variant = "full", size = "md", className, href = "/" }: LogoProps) {
  const dimensions = sizeMap[variant][size]

  const logoSrc = {
    full: "/logo/hbu-logo-main.svg",
    icon: "/logo/hbu-icon.svg",
    wordmark: "/logo/hbu-wordmark.svg",
  }[variant]

  const logoContent = (
    <Image
      src={logoSrc || "/placeholder.svg"}
      alt="HBU Asset Recovery"
      width={dimensions.width}
      height={dimensions.height}
      className={cn("transition-opacity hover:opacity-80", className)}
      priority
    />
  )

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {logoContent}
      </Link>
    )
  }

  return logoContent
}
