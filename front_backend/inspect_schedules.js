const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5433/traivldb' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const places = await prisma.place.findMany({
      where: {
        name: '철학의 길 벚꽃 축제'
      }
    });
    console.log('--- Place Query ---');
    console.log(places);
  } catch (e) {
    console.error('Inspection failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
