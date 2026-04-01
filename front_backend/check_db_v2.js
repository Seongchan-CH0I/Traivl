
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.place.count();
    console.log(`Total places: ${count}`);
    const top10 = await prisma.place.findMany({
      take: 10,
      orderBy: { rank: "asc" },
      select: { name: true, rank: true }
    });
    console.log("Top 10 places in DB:", JSON.stringify(top10, null, 2));
  } catch (error) {
    console.error("Prisma error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
