import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET /api/feed/schedules
export async function GET(req: NextRequest) {
    try {
        const sharedSchedules = await prisma.schedule.findMany({
            where: { isShared: true },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                        dnaType: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            data: sharedSchedules
        });
    } catch (error: any) {
        console.error('GET Feed Schedules error:', error);
        return NextResponse.json(
            { success: false, message: '피드 일정을 가져오는 도중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
