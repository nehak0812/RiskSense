const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const seededUrls = [
    "https://www.reuters.com/business/retail-consumer/eu-rules-deforestation-compliance-2026",
    "https://www.ft.com/content/ai-governance-corporate-compliance-boardrooms-eu-act",
    "https://www.bloomberg.com/news/climate-change-water-scarcity-production-halts",
    "https://www.wsj.com/articles/shipping-channel-volatility-inflation-buffers",
    "https://www.reuters.com/business/global-inflation-interest-rates-stabilise-margin-squeeze-2026"
  ];
  
  // Delete all non-seeded signals
  const result = await prisma.signal.deleteMany({
    where: {
      url: {
        notIn: seededUrls
      }
    }
  });
  console.log(`Deleted ${result.count} non-seeded signals from database.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
