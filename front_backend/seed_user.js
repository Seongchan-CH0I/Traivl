const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5433/traivldb' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function hashPassword(password) {
    const salt = 'traivl_salt_key_12984';
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

async function main() {
  try {
    await prisma.user.deleteMany({ where: { id: '333yjs' } });
    const user = await prisma.user.create({
      data: {
        id: '333yjs',
        email: 'test@traivl.com',
        name: '윤주상',
        password: hashPassword('password'),
        dnaType: '클래식 슬로우뷰어'
      }
    });
    console.log('Seeded User:', user);
  } catch (e) {
    console.error('Seeding user failed:', e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
