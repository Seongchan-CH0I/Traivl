from fastapi import APIRouter
from app.models.chat_model import ChatAskRequest, ChatAskResponse, ChatAskData

router = APIRouter()

@router.post("/ask", response_model=ChatAskResponse, summary="실시간 모바일 스마트 가이드", description="여행 중 발생하는 상황이나 궁금증에 대해 채팅으로 현지 언어/문화와 맥락에 맞는 답변을 제공합니다.")
async def ask_assistant(request: ChatAskRequest):
    # TODO: 채팅 히스토리 조회 및 LLM 응답 스트리밍 로직 (현재는 Mock 데이터)
    mock_data = ChatAskResponse(
        status="success",
        data=ChatAskData(
            reply_message="현재 복장으로는 입장이 어려워요! 태국 왕궁은 예절을 중시해서 반바지나 민소매 차림으로는 들어갈 수 없습니다. 근처 상점이나 대여소에서 긴 치마나 바지를 빌려 입으셔야 합니다.",
            cultural_tips=["태국의 사원이나 왕궁 입장 시 어깨와 무릎이 가려지는 단정한 복장은 필수적인 문화적 예의입니다."],
            suggested_actions=["근처 옷 대여소 추천받기", "복장 제한이 없는 인근 다른 명소 추천받기"]
        )
    )
    return mock_data# TODO: 채팅 관련 엔드포인트 구현
