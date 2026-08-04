const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5433/traivldb' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const result = await prisma.schedule.deleteMany();
    console.log(`Deleted ${result.count} schedules from the database.`);
  } catch (e) {
    console.error('Delete failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
