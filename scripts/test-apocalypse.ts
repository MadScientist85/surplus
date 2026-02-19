import { runDailyApocalypse } from "../lib/scraping/apocalypse-engine"

async function testApocalypse() {
  console.log("🚀 Starting Apocalypse Engine Test...\n")

  try {
    const results = await runDailyApocalypse()

    console.log("\n✅ Apocalypse Engine Test Complete!")
    console.log("📊 Results:")
    console.log(`   Total Leads: ${results.totalLeads}`)
    console.log(`   High Value: ${results.highValueLeads}`)
    console.log(`   Enriched: ${results.enriched}`)
    console.log(`   Success Rate: ${((results.enriched / results.highValueLeads) * 100).toFixed(1)}%`)
  } catch (error) {
    console.error("❌ Test failed:", error)
    process.exit(1)
  }
}

testApocalypse()
