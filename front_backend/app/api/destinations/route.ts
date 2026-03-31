import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/destinations          → 전체 8개 도시 목록
// GET /api/destinations?id=JP_KYOTO → 특정 도시 상세
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            // 특정 도시 상세 조회
            const destination = await prisma.destination.findUnique({
                where: { id },
            });

            if (!destination) {
                return NextResponse.json(
                    { success: false, error: '해당 도시를 찾을 수 없습니다.' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ success: true, data: destination });
        }

        // 전체 도시 목록 조회
        const destinations = await prisma.destination.findMany();

        return NextResponse.json({ success: true, data: destinations });

    } catch (error) {
        console.error('[API] /api/destinations 오류:', error);
        return NextResponse.json(
            { success: false, error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
