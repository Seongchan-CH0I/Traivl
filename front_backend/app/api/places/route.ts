import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/places?city=교토
// GET /api/places?destinationId=JP_KYOTO
// GET /api/places?destinationId=JP_KYOTO&category=관광지
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const destinationId = searchParams.get('destinationId');
        const city = searchParams.get('city');
        const category = searchParams.get('category');
        const name = searchParams.get('name');
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

        const excludeTips = searchParams.get('excludeTips') === 'true' || searchParams.get('forCourse') === 'true';
        const isPurePlaceOrFood = category === '관광지' || category === '맛집' || excludeTips;

        // 하드코딩 0% - DB 동적 조건 구성
        const whereClause: any = {
            ...(destinationId ? { destinationId } : {}),
            ...(category ? { category } : {}),
            ...(name ? { name } : {}),
            ...(isPurePlaceOrFood ? { 
                rank: { lte: 10 },
                category: category || { notIn: ['팁', '이벤트'] }
            } : {}),
        };

        if (city && !destinationId) {
            whereClause.OR = [
                { destination: { name: { contains: city } } },
                { destination: { country: { contains: city } } },
                { destinationId: { contains: city } },
                { address: { contains: city } }
            ];
        }

        const places = await prisma.place.findMany({
            where: whereClause,
            include: {
                destination: {
                    select: { name: true, country: true }
                }
            },
            orderBy: { rank: 'asc' },
            ...(limit ? { take: limit } : {}),
        });

        // 💡 외부 비보안/깨지는 이미지 로컬 정적 에셋으로 안전 매핑 및 팁/이벤트 최종 안전 필터링
        const sanitizedPlaces = places
            .filter((place) => !isPurePlaceOrFood || (place.rank && place.rank <= 10 && place.category !== '팁' && place.category !== '이벤트'))
            .map((place) => {
                if (place.name === '설악산') {
                    return { ...place, imageUrl: '/images/places/seoraksan.jpg' };
                }
                if (place.name === '루브르 박물관') {
                    return { ...place, imageUrl: '/images/places/louvre.webp' };
                }
                if (place.name === '키시모토') {
                    return { ...place, imageUrl: '/images/places/kishimoto.jpg' };
                }
                if (place.name === '청초수물회') {
                    return { ...place, imageUrl: '/images/places/cheongchosu.webp' };
                }
                if (place.name === '하나마루켄') {
                    return { ...place, imageUrl: '/images/places/hanamaluken.jpg' };
                }
                if (place.name === '우오베이') {
                    return { ...place, imageUrl: '/images/places/uobei.jpg' };
                }
                if (place.name === '봉포머구리') {
                    return { ...place, imageUrl: '/images/places/bongpomuguri.jpg' };
                }
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
