import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET /api/schedules?userId=xxx
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'userId가 필요합니다.' },
                { status: 400 }
            );
        }

        const schedules = await prisma.schedule.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            data: schedules
        });
    } catch (error: any) {
        console.error('GET Schedules error:', error);
        return NextResponse.json(
            { success: false, message: '일정을 가져오는 도중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// POST /api/schedules
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, title, city, startDate, endDate, itineraryData } = body;

        if (!userId || !city || !itineraryData) {
            return NextResponse.json(
                { success: false, message: '필수 필드가 누락되었습니다.' },
                { status: 400 }
            );
        }

        const newSchedule = await prisma.schedule.create({
            data: {
                userId,
                title: title || `${city} 여행`,
                city,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                itineraryData,
                isShared: false
            }
        });

        return NextResponse.json({
            success: true,
            data: newSchedule
        });
    } catch (error: any) {
        console.error('POST Schedule error:', error);
        return NextResponse.json(
            { success: false, message: '일정을 저장하는 도중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// PUT /api/schedules
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, itineraryData } = body;

        if (!id || !itineraryData) {
            return NextResponse.json(
                { success: false, message: 'id와 itineraryData가 필요합니다.' },
                { status: 400 }
            );
        }

        const updatedSchedule = await prisma.schedule.update({
            where: { id },
            data: { itineraryData }
        });

        return NextResponse.json({
            success: true,
            data: updatedSchedule
        });
    } catch (error: any) {
        console.error('PUT Schedule error:', error);
        return NextResponse.json(
            { success: false, message: '일정을 수정하는 도중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE /api/schedules?id=xxx
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'id가 필요합니다.' },
                { status: 400 }
            );
        }

        await prisma.schedule.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: '일정이 삭제되었습니다.'
        });
    } catch (error: any) {
        console.error('DELETE Schedule error:', error);
        return NextResponse.json(
            { success: false, message: '일정을 삭제하는 도중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
