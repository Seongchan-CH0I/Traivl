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
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

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
