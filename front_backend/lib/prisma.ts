import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Next.js 핫리로드 및 서버리스 환경에서 PrismaClient 인스턴스가 여러 개 생성되는 문제 방지
// globalThis에 캐싱해서 싱글톤으로 관리
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
    const connectionString =
        process.env.DATABASE_URL ||
        'postgresql://postgres:password@127.0.0.1:5433/traivldb';
    // 서버리스(Vercel)에서는 인스턴스당 커넥션을 최소로 유지해야 DB 커넥션이 고갈되지 않음
    const pool = new Pool({
        connectionString,
        max: Number(process.env.DB_POOL_MAX ?? 1),
        idleTimeoutMillis: 10_000,
        connectionTimeoutMillis: 10_000,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
