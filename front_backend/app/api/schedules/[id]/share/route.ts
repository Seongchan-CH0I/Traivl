import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        // Next.js 15+ support: params can be a Promise
        const params = await context.params;
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { success: false, message: '일정 ID가 필요합니다.' },
                { status: 400 }
            );
        }

        const body = await req.json();
        const { isShared, shareContent } = body;

        const updatedSchedule = await prisma.schedule.update({
            where: { id },
            data: {
                isShared: typeof isShared === 'boolean' ? isShared : undefined,
                shareContent: shareContent !== undefined ? shareContent : undefined
            }
        });

        return NextResponse.json({
            success: true,
            data: updatedSchedule
        });
    } catch (error: any) {
        console.error('PUT Schedule Share error:', error);
        return NextResponse.json(
            { success: false, message: '일정 공유 상태 변경 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
