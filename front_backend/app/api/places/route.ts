import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/places?destinationId=JP_KYOTO
// GET /api/places?destinationId=JP_KYOTO&category=관광지
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const destinationId = searchParams.get('destinationId');
        const category = searchParams.get('category'); // 선택적 필터

        if (!destinationId) {
            return NextResponse.json(
                { success: false, error: 'destinationId는 필수 파라미터입니다.' },
                { status: 400 }
            );
        }

        const places = await prisma.place.findMany({
            where: {
                destinationId,
                ...(category ? { category } : {}),
            },
            orderBy: { rank: 'asc' },
        });

        return NextResponse.json({ success: true, data: places });

    } catch (error) {
        console.error('[API] /api/places 오류:', error);
        return NextResponse.json(
            { success: false, error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
