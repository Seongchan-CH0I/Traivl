import { NextResponse } from 'next/server';
import { analyzeSurvey, saveUserDna, getUserDna, deleteUserDna } from '../../../services/dnaAnalyzeService';

// GET: 유저가 기존에 검사해둔 결과를 불러오기
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false }, { status: 400 });
        }

        const savedDna = await getUserDna(userId);

        // 결과가 있으면 반환, 없으면 null 반환 (아직 검사 안한 상태)
        return NextResponse.json(
            { success: !!savedDna, data: savedDna },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ success: false, error: "서버 오류" }, { status: 500 });
    }
}

// DELETE: 유저의 기존 검사 결과를 초기화하기
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, error: "UserId is required" }, { status: 400 });
        }

        const success = await deleteUserDna(userId);

        return NextResponse.json(
            { success },
            { status: success ? 200 : 500 }
        );
    } catch (error) {
        return NextResponse.json({ success: false, error: "서버 오류" }, { status: 500 });
    }
}

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
