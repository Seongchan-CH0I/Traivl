import { NextResponse } from 'next/server';
import { analyzeSurvey, saveUserDna } from '../../../services/dnaAnalyzeService';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { answers, userId } = body;

        // 답변 데이터가 유효하지 않을 방어 코드
        if (!answers || !Array.isArray(answers) || answers.length !== 4) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: "설문 데이터가 올바르지 않습니다." } },
                { status: 400 }
            );
        }

        // 서비스 레이어의 알고리즘 실행하여 추천 여행지 1곳 선정
        const resultDestination = analyzeSurvey(answers);

        // 프론트엔드에서 전달받은 유저(Mock) 아이디가 있다면 DB에 결과를 저장 지시!
        if (userId) {
            await saveUserDna(userId, resultDestination.dnaType, resultDestination.id);
        }

        // 프론트로 데이터 반환 (API 명세 형식 맞춤)
        return NextResponse.json(
            {
                success: true,
                data: resultDestination
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Survey analyze error:", error);
        return NextResponse.json(
            { success: false, error: { code: "SERVER_ERROR", message: "분석 중 서버 오류가 발생했습니다." } },
            { status: 500 }
        );
    }
}
