import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, userName, continent, country, destination, duration, travelStyle, dnaType } = body;

        // 1. 데이터 유효성 검사
        if (!destination || !duration || !travelStyle) {
            return NextResponse.json(
                { success: false, message: "필수 데이터가 누락되었습니다." },
                { status: 400 }
            );
        }

        // 2. AI 서버(FastAPI) 호출
        const AI_ENGINE_URL = "http://localhost:8000";

        console.log(`[Backend] AI 요청 중... URL: ${AI_ENGINE_URL}/api/v1/plan/recommend`);

        const aiRequestBody = {
            user_id: userId,
            user_name: userName,
            continent: continent,
            country: country,
            destination: destination,
            duration: duration,
            travel_style: travelStyle,
            dna_type: dnaType
        };

        const aiResponse = await fetch(`${AI_ENGINE_URL}/api/v1/plan/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(aiRequestBody),
        });

        if (!aiResponse.ok) {
            throw new Error("AI 서버로부터 응답을 받지 못했습니다.");
        }

        const aiData = await aiResponse.json();

        // 4. 프론트로 최종 결과 반환
        return NextResponse.json({
            success: true,
            data: aiData
        });

    } catch (error: any) {
        console.error("AI Recommendation Error:", error);
        return NextResponse.json(
            { success: false, message: error.message || "서버 내부 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
