"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Asset Recovery Specialist",
    company: "Recovery Partners LLC",
    content:
      "HBU Recovery has completely transformed our operation. We've 3x'd our recovery rate while maintaining 100% compliance.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Operations Director",
    company: "Nationwide Claims",
    content: "The AI automation saves us 20+ hours per week. We can now handle 10x more claims with the same team.",
    rating: 5,
  },
  {
    name: "Lisa Rodriguez",
    role: "Compliance Officer",
    company: "Secure Recovery Group",
    content: "Finally, a platform that takes compliance seriously. TCPA tools are built-in and actually work.",
    rating: 5,
  },
  {
    name: "David Thompson",
    role: "Founder",
    company: "Thompson Recovery",
    content: "ROI paid for itself in the first month. The skip tracing alone is worth the subscription.",
    rating: 5,
  },
]

export function TestimonialMarquee() {
  return (
    <section className="py-20 sm:py-32 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Trusted by Recovery Professionals</h2>
          <p className="text-lg text-muted-foreground">See what industry leaders say about HBU Recovery</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed">{testimonial.content}</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.company}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
