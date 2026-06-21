from pydantic import BaseModel
from typing import List, Optional

# ==========================================
# 5. /chat/ask 관련 모델
# ==========================================

# === 요청 모델 ===
class ChatAskRequest(BaseModel):
    user_id: str
    user_name: Optional[str] = "User"
    current_location: Optional[str] = None       # 사용자 현재 위치 (도시명)
    message: str                                   # 사용자 입력 메시지
    dna_type: Optional[str] = None                # 여행 DNA 유형
    chat_history_id: str                           # 세션 식별자

# === SSE 스트리밍 청크 모델 ===
class ChatStreamChunk(BaseModel):
    """SSE로 클라이언트에 전송되는 개별 청크"""
    type: str            # "token" | "done" | "error"
    content: str = ""    # 텍스트 토큰 내용
    metadata: Optional[dict] = None  # 완료 시 추가 메타데이터 (suggested_actions 등)

# === 대화 히스토리 모델 (Redis 저장용) ===
class ChatMessage(BaseModel):
    role: str            # "user" | "assistant" | "system"
    content: str
    timestamp: Optional[str] = None

# === 비-스트리밍 Fallback 응답 (호환용) ===
class ChatAskData(BaseModel):
    reply_message: str
    cultural_tips: List[str]
    suggested_actions: List[str]

class ChatAskResponse(BaseModel):
    status: str
    data: ChatAskData
