const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const destinations = await prisma.destination.findMany();
    console.log('--- Destinations ---');
    destinations.forEach(d => console.log(`- ${d.id}: ${d.name}`));
    
    const places = await prisma.place.findMany({
      where: { destinationId: 'JP_FUKUOKA' }
    });
    console.log('\n--- Fukuoka Places ---');
    places.forEach(p => console.log(`- ${p.name}: ${p.imageUrl}`));
  } catch (e) {
    console.error('Verification failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
