import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ message: '안녕하세요! 백엔드 API가 정상 작동 중입니다.' });
}
