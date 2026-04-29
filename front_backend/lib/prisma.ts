import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Next.js 핫리로드 시 PrismaClient 인스턴스가 여러 개 생성되는 문제 방지
// globalThis에 캐싱해서 싱글톤으로 관리
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
    const connectionString =
        process.env.DATABASE_URL ||
        'postgresql://postgres:password@127.0.0.1:5433/traivldb';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

export const prisma = createPrismaClient();

// if (process.env.NODE_ENV !== 'production') {
//     globalForPrisma.prisma = prisma;
// }
