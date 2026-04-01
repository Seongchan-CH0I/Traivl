
const { PrismaClient } = require("./lib/generated/prisma");

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.place.count();
  console.log(`Total places: ${count}`);
  const top10 = await prisma.place.findMany({
    take: 10,
    orderBy: { rank: "asc" },
    select: { name: true, rank: true }
  });
  console.log("Top 10 places in DB:", JSON.stringify(top10, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
