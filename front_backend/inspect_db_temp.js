const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:password@127.0.0.1:5433/traivldb';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const destCount = await prisma.destination.count();
    const placeCount = await prisma.place.count();
    console.log(`Destinations count: ${destCount}`);
    console.log(`Places count: ${placeCount}`);

    if (destCount > 0) {
      const dests = await prisma.destination.findMany({ take: 3 });
      console.log('Sample Destinations:', JSON.stringify(dests, null, 2));
    }
    
    if (placeCount > 0) {
      const places = await prisma.place.findMany({ take: 3 });
      console.log('Sample Places:', JSON.stringify(places, null, 2));
    }
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
