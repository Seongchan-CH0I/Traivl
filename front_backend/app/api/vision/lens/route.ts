import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_location, image_base64, mode, extracted_text } = body;

        // AI 서버(FastAPI) URL 설정 (도커 컴포즈 호환 및 로컬 호스트 폴백)
        const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://localhost:8000";

        console.log(`[Proxy] AI 비전 렌즈 분석 요청 중... URL: ${AI_ENGINE_URL}/api/v1/vision/lens`);

        const aiResponse = await fetch(`${AI_ENGINE_URL}/api/v1/vision/lens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_location: user_location || "unknown",
                image_base64: image_base64 || null,
                mode: mode || "auto",
                extracted_text: extracted_text || null
            }),
        });

        if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            throw new Error(`AI 서버 오류: ${errText || aiResponse.statusText}`);
        }

        const aiData = await aiResponse.json();

        return NextResponse.json(aiData);

    } catch (error: any) {
        console.error("Vision Proxy API Error:", error);
        return NextResponse.json(
            { status: "error", message: error.message || "서버 내부 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
