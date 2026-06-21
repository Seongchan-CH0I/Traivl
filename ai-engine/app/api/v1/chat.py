from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.chat_model import ChatAskRequest
from app.services.chat_service import chat_service

router = APIRouter()

@router.post(
    "/ask",
    summary="실시간 모바일 스마트 가이드 (SSE 스트리밍)",
    description="여행 중 발생하는 상황이나 궁금증에 대해 채팅으로 답변합니다. SSE 스트리밍 방식으로 실시간 응답을 전송합니다."
)
async def ask_assistant(request: ChatAskRequest):
    return StreamingResponse(
        chat_service.stream_chat(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Nginx 프록시 버퍼링 방지
        }
    )
