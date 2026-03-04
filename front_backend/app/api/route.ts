import { NextResponse } from 'next/server';

/**
 * [성찬/주상 담당] Next.js 백엔드 API 예시
 * 
 * 1. 로컬 개발 시: .env 파일의 NEXT_PUBLIC_AI_SERVER_URL=http://localhost:8000 사용
 * 2. 도커 통합 시: .env 파일의 NEXT_PUBLIC_AI_SERVER_URL=http://ai-server:8000 사용 (주석 해제 필요)
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // AI 엔진 호출 주소 (환경 변수 사용)
        const aiServerUrl = process.env.NEXT_PUBLIC_AI_SERVER_URL;

        // AI 서버에 추천 경로 요청
        const aiResponse = await fetch(`${aiServerUrl}/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!aiResponse.ok) {
            throw new Error('AI 서버 응답 실패');
        }

        const data = await aiResponse.json();
        
        return NextResponse.json({ 
            status: 'success', 
            data: data 
        });
        
    } catch (error) {
        console.error('API 에러:', error);
        return NextResponse.json({ 
            status: 'error', 
            message: '서버 내부 오류가 발생했습니다.' 
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: 'Traivl API 서비스가 활성화되어 있습니다.' });
}