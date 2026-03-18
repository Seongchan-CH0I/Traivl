from fastapi import APIRouter
from app.models.voice_model import VoiceInterpreterRequest, VoiceInterpreterResponse, VoiceInterpreterData

router = APIRouter()

@router.post("/interpreter", response_model=VoiceInterpreterResponse, summary="실시간 통역기반 에티켓 해설", description="사용자 대화나 텍스트를 분석해 현지 문화와 언어로 된 번역, 의도, 응답 예시(가이드) 등을 제공합니다.")
async def voice_interpreter(request: VoiceInterpreterRequest):
    # TODO: STT 결과 처리 및 LLM 프롬프트 추천 연동 (현재는 Mock 데이터)
    mock_data = VoiceInterpreterResponse(
        status="success",
        data=VoiceInterpreterData(
            translated_text="감사합니다",
            intent_analysis="상대방이 호의와 고마움을 표시하는 인사말입니다.",
            cultural_context="남성의 경우 끝에 '캅', 여성의 경우 '카'를 붙여 성별에 따른 정중함을 구분하는 태국만의 문화가 있습니다.",
            suggested_reply_ko="저도 감사합니다. (마이 뻰 라이 캅/카)",
            suggested_reply_audio_url="https://ai-server.example.com/audio/voice_gen_123.mp3"
        )
    )
    return mock_data# TODO: 음성 분석 & STT 관련 엔드포인트 구현
