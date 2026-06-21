import json
import redis
from typing import Generator, List
from datetime import datetime

from google import genai
from google.genai import types

from app.core.config import settings
from app.models.chat_model import ChatAskRequest, ChatMessage, ChatStreamChunk

# 시스템 프롬프트: 챗봇의 역할과 행동 규칙을 정의
SYSTEM_PROMPT = """
[역할]
당신은 'Traivl AI 가이드'입니다. 해외 여행 중인 한국인 사용자를 돕는 실시간 모바일 여행 도우미입니다.

[행동 원칙]
1. 항상 친절하고 자연스러운 한국어로 답변하세요.
2. 사용자의 현재 위치(도시/국가)와 여행 DNA 성향을 고려하여 맞춤형 답변을 제공하세요.
3. 여행과 관련된 질문(현지 문화, 맛집, 교통, 에티켓, 날씨, 쇼핑, 안전 등)에 특화되어 답변하세요.
4. 위험하거나 불법적인 활동에 대한 질문은 정중히 거절하세요.
5. 모르는 정보는 솔직하게 모른다고 하고, 현지 관광 안내소나 검색을 권유하세요.
6. 답변은 간결하되 핵심적인 정보를 놓치지 마세요. 길어야 300자 이내로 답변하세요.
"""


class ChatService:
    def __init__(self):
        # Gemini 클라이언트 초기화
        if settings.GOOGLE_API_KEY:
            self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)
            self.target_model = "gemini-flash-latest"
            print(f"✅ 챗봇 서비스: Gemini 준비 완료 (Target: {self.target_model})")
        else:
            self.client = None
            print("⚠️ 챗봇 서비스: GOOGLE_API_KEY가 없어 AI 채팅 기능을 사용할 수 없습니다.")

        # Redis 클라이언트 초기화
        try:
            self.redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                decode_responses=True
            )
            self.redis_client.ping()
            print("✅ 챗봇 서비스: Redis 연결 성공")
        except Exception as e:
            self.redis_client = None
            print(f"⚠️ 챗봇 서비스: Redis 연결 실패 ({e}), 세션 메모리 비활성화")

        # 대화 히스토리 설정
        self.max_history = 20      # 최대 보관 턴 수 (20턴 = 10번 왕복)
        self.session_ttl = 3600    # 세션 만료 시간 (1시간)

    def _get_redis_key(self, session_id: str) -> str:
        """Redis 키 생성"""
        return f"chat:session:{session_id}"

    def _load_history(self, session_id: str) -> List[ChatMessage]:
        """Redis에서 대화 히스토리 로드"""
        if not self.redis_client:
            return []
        try:
            key = self._get_redis_key(session_id)
            data = self.redis_client.get(key)
            if data:
                messages = json.loads(data)
                return [ChatMessage(**msg) for msg in messages]
        except Exception as e:
            print(f"⚠️ 히스토리 로드 실패: {e}")
        return []

    def _save_history(self, session_id: str, messages: List[ChatMessage]):
        """Redis에 대화 히스토리 저장 (TTL 적용)"""
        if not self.redis_client:
            return
        try:
            key = self._get_redis_key(session_id)
            # 최대 턴 수 제한
            trimmed = messages[-self.max_history:]
            data = json.dumps([msg.model_dump() for msg in trimmed], ensure_ascii=False)
            self.redis_client.setex(key, self.session_ttl, data)
        except Exception as e:
            print(f"⚠️ 히스토리 저장 실패: {e}")

    def _build_context_prompt(self, request: ChatAskRequest) -> str:
        """사용자의 여행 컨텍스트를 동적 프롬프트로 생성"""
        parts = []
        if request.current_location:
            parts.append(f"사용자의 현재 위치: {request.current_location}")
        if request.dna_type:
            parts.append(f"사용자의 여행 DNA 유형: {request.dna_type}")
        if request.user_name and request.user_name != "User":
            parts.append(f"사용자 이름: {request.user_name}")
        return "\n".join(parts) if parts else ""

    def stream_chat(self, request: ChatAskRequest) -> Generator[str, None, None]:
        """
        SSE 스트리밍 방식으로 Gemini 응답을 청크 단위로 반환합니다.
        각 청크는 'data: {JSON}\n\n' 형태의 SSE 이벤트입니다.
        """
        if not self.client:
            error_chunk = ChatStreamChunk(
                type="error",
                content="AI 서비스가 비활성화 상태입니다. GOOGLE_API_KEY를 확인해주세요."
            )
            yield f"data: {error_chunk.model_dump_json()}\n\n"
            return

        # 1. 대화 히스토리 로드
        history = self._load_history(request.chat_history_id)

        # 2. 시스템 프롬프트 + 사용자 컨텍스트 구성
        context_info = self._build_context_prompt(request)
        system_instruction = SYSTEM_PROMPT
        if context_info:
            system_instruction += f"\n\n[현재 여행 컨텍스트]\n{context_info}"

        # 3. Gemini Contents 형식으로 대화 히스토리 변환
        contents = []
        for msg in history:
            role = "user" if msg.role == "user" else "model"
            contents.append(
                types.Content(role=role, parts=[types.Part.from_text(text=msg.content)])
            )

        # 현재 사용자 메시지 추가
        contents.append(
            types.Content(role="user", parts=[types.Part.from_text(text=request.message)])
        )

        # 4. Gemini 스트리밍 호출
        full_response = ""
        try:
            response_stream = self.client.models.generate_content_stream(
                model=self.target_model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7,
                    max_output_tokens=1024,
                )
            )

            for chunk in response_stream:
                if chunk.text:
                    full_response += chunk.text
                    token_chunk = ChatStreamChunk(type="token", content=chunk.text)
                    yield f"data: {token_chunk.model_dump_json()}\n\n"

            # 5. 완료 이벤트 전송
            done_chunk = ChatStreamChunk(
                type="done",
                content="",
                metadata={
                    "suggested_actions": []  # Phase 2에서 컨텍스트 기반 액션 버튼 추가 예정
                }
            )
            yield f"data: {done_chunk.model_dump_json()}\n\n"

            # 6. 히스토리에 현재 턴 저장
            now = datetime.now().isoformat()
            history.append(ChatMessage(role="user", content=request.message, timestamp=now))
            history.append(ChatMessage(role="assistant", content=full_response, timestamp=now))
            self._save_history(request.chat_history_id, history)

            print(f"💬 챗봇 응답 완료 (세션: {request.chat_history_id}, 응답 길이: {len(full_response)}자)")

        except Exception as e:
            print(f"❌ Gemini 스트리밍 오류: {e}")
            error_chunk = ChatStreamChunk(
                type="error",
                content=f"AI 응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            )
            yield f"data: {error_chunk.model_dump_json()}\n\n"


chat_service = ChatService()
