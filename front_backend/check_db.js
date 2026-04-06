const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const places = await prisma.place.findMany({
    where: {
      destinationId: 'KR_SEOUL'
    },
    orderBy: {
      rank: 'asc'
    }
  });
  console.log(JSON.stringify(places, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
