import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// POST /api/feed/schedules/copy
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, scheduleId } = body;

        if (!userId || !scheduleId) {
            return NextResponse.json(
                { success: false, message: 'userId와 scheduleId가 필요합니다.' },
                { status: 400 }
            );
        }

        // 1. 복사 대상 일정 조회
        const sourceSchedule = await prisma.schedule.findUnique({
            where: { id: scheduleId }
        });

        if (!sourceSchedule) {
            return NextResponse.json(
                { success: false, message: '복사할 대상을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 2. 현재 로그인한 유저의 소유로 복제 (Deep Copy)
        const copiedSchedule = await prisma.schedule.create({
            data: {
                userId,
                title: `${sourceSchedule.title}`, // 원래 제목 유지 혹은 접미사 추가
                city: sourceSchedule.city,
                startDate: sourceSchedule.startDate,
                endDate: sourceSchedule.endDate,
                itineraryData: sourceSchedule.itineraryData as any,
                isShared: false // 복사본은 기본적으로 비공유 상태
            }
        });

        return NextResponse.json({
            success: true,
            data: copiedSchedule,
            message: '일정을 내 보관함으로 가져왔습니다!'
        });
    } catch (error: any) {
        console.error('POST Schedule Copy error:', error);
        return NextResponse.json(
            { success: false, message: '일정을 가져오는 도중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
