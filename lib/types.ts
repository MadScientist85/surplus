export interface StateDatabase {
  state: string
  name: string
  url: string
  searchType: "form" | "api" | "scrape"
  selectors?: {
    searchInput?: string
    submitButton?: string
    resultsTable?: string
    nameField?: string
    amountField?: string
    addressField?: string
  }
}

export interface ScrapedLead {
  claimantName: string
  propertyAddress?: string
  state: string
  county?: string
  claimAmount: number
  source: string
  rawData?: any
}

export interface QuantumPrediction {
  leadId: string
  recoveryProbability: number
  estimatedValue: number
  confidence: number
  reasoning: string
}

export interface SkipTraceProvider {
  name: string
  priority: number
  timeout: number
  costPerLead: number
}

export interface EnrichedLead extends ScrapedLead {
  phone?: string
  email?: string
  mailingAddress?: string
  skipTraceProvider?: string
  enrichmentScore?: number
  dncScrubbed: boolean
}

export interface FilingTemplate {
  state: string
  formName: string
  fields: Record<string, string>
  submissionUrl: string
  requiredDocuments: string[]
}
