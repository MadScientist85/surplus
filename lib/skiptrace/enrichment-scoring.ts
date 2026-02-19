/**
 * Calculate enrichment score based on data completeness and quality
 */
export function calculateEnrichmentScore(data: any): number {
  let score = 0
  let maxScore = 0

  // Phone (35 points)
  maxScore += 35
  if (data.phone) {
    score += 35
    // Bonus for mobile vs landline
    if (data.phoneType === "mobile") {
      score += 5
      maxScore += 5
    }
  }

  // Email (30 points)
  maxScore += 30
  if (data.email) {
    score += 30
    // Bonus for verified email
    if (data.emailVerified) {
      score += 5
      maxScore += 5
    }
  }

  // Mailing Address (25 points)
  maxScore += 25
  if (data.mailingAddress) {
    score += 25
  }

  // Property Data (10 points)
  maxScore += 10
  if (data.propertyData) {
    score += 10
  }

  // Normalize to 0-1 scale
  const normalizedScore = maxScore > 0 ? score / maxScore : 0

  return Math.round(normalizedScore * 100) / 100
}
