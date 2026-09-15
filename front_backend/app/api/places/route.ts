import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/places?destinationId=JP_KYOTO
// GET /api/places?destinationId=JP_KYOTO&category=관광지
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const destinationId = searchParams.get('destinationId');
        const category = searchParams.get('category');
        const name = searchParams.get('name');
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

        const isPurePlaceOrFood = category === '관광지' || category === '맛집';

        const places = await prisma.place.findMany({
            where: {
                ...(destinationId ? { destinationId } : {}),
                ...(category ? { category } : {}),
                ...(name ? { name } : {}),
                ...(isPurePlaceOrFood ? { rank: { lte: 10 } } : {}),
            },
            include: {
                destination: {
                    select: { name: true }
                }
            },
            orderBy: { rank: 'asc' },
            ...(limit ? { take: limit } : {}),
        });

        // 💡 외부 비보안/깨지는 이미지 로컬 정적 에셋으로 안전 매핑
        const sanitizedPlaces = places
            .filter((place) => !isPurePlaceOrFood || (place.rank && place.rank <= 10))
            .map((place) => {
                if (place.imageUrl && place.imageUrl.includes('tetsugakunomichi_spring_1.jpg')) {
                    return { ...place, imageUrl: '/images/tetsugakunomichi_spring_1.jpg' };
                }
                return place;
            });

        return NextResponse.json({ success: true, data: sanitizedPlaces });

    } catch (error: any) {
        console.error('[API] /api/places 오류:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error.message || '서버 오류가 발생했습니다.',
                debug: {
                    dbUrl: process.env.DATABASE_URL,
                    message: error.message
                }
            },
            { status: 500 }
        );
    }
}
