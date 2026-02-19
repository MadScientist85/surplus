"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "How does HBU Recovery ensure TCPA compliance?",
    answer:
      "HBU Recovery has built-in compliance tools that automatically check call windows (8AM-9PM local time), scrub against Do Not Call registries, add opt-out links to all communications, and maintain immutable audit trails via blockchain-backed Ethics NFTs.",
  },
  {
    question: "Which states do you support?",
    answer:
      "We support all 50 states for surplus funds, 12(o) filings, and unclaimed property recovery. Each state has custom workflows that handle state-specific requirements automatically.",
  },
  {
    question: "How accurate is the skip tracing?",
    answer:
      "Our multi-source skip tracing aggregates data from 12+ providers including PropStream, BatchSkip, TruePeopleSearch, and more. We achieve a 95%+ contact rate with phone numbers and 87% with email addresses.",
  },
  {
    question: "Can I use this for my existing claims?",
    answer:
      "Yes! You can import your existing claim data via CSV or our API. The system will automatically enrich the data and set up compliance-checked outreach workflows.",
  },
  {
    question: "What kind of support do you offer?",
    answer:
      "All plans include email support. Professional plans get priority support with 4-hour response time. Enterprise plans include 24/7 dedicated support and a dedicated account manager.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes! The Starter plan includes a 14-day free trial with full access to all features. No credit card required.",
  },
]

export function FAQSection() {
  return (
    <section className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">Everything you need to know about HBU Recovery</p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
