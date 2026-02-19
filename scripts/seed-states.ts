import { prisma } from "../lib/prisma"

async function seedStates() {
  console.log("Seeding state data...")

  // Add any initial data seeding here
  // For example, creating test leads or configuration data

  console.log("Seed completed!")
}

seedStates()
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
