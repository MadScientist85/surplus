import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding MCP demo data...")

  // Create sample tool executions
  const tools = ["skip_trace", "file_claim", "send_sms", "generate_nft", "check_dnc"]

  for (let i = 0; i < 20; i++) {
    await prisma.toolExecution.create({
      data: {
        toolName: tools[Math.floor(Math.random() * tools.length)],
        args: { leadId: `lead-${i}`, state: "FL" },
        result: { success: true, data: {} },
        userId: "demo-user",
        prompt: `Demo execution ${i}`,
        success: Math.random() > 0.1, // 90% success rate
        duration: Math.floor(Math.random() * 2000) + 100,
      },
    })
  }

  // Create sample webhook events
  const webhookTypes = ["twilio_stop", "docusign_signed", "clerk_update", "polygon_bounty"]

  for (let i = 0; i < 10; i++) {
    await prisma.webhookEvent.create({
      data: {
        type: webhookTypes[Math.floor(Math.random() * webhookTypes.length)],
        payload: { eventId: `event-${i}` },
        aiResponse: "AI processed the webhook successfully",
        success: Math.random() > 0.05, // 95% success rate
      },
    })
  }

  console.log("✅ MCP demo data seeded successfully")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
