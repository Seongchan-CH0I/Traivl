import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/places?destinationId=JP_KYOTO
// GET /api/places?destinationId=JP_KYOTO&category=관광지
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const destinationId = searchParams.get('destinationId');
        const category = searchParams.get('category'); // 선택적 필터
        const limitStr = searchParams.get('limit');
        const limit = limitStr ? parseInt(limitStr) : undefined;

        const places = await prisma.place.findMany({
            where: {
                ...(destinationId ? { destinationId } : {}),
                ...(category ? { category } : {}),
            },
            include: {
                destination: {
                    select: { name: true }
                }
            },
            orderBy: { rank: 'asc' },
            ...(limit ? { take: limit } : {}),
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
