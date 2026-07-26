import base64
import os
import re
import whisper
from google import genai
from google.genai import types
from app.core.config import settings
from app.models.voice_model import VoiceInterpreterRequest, VoiceInterpreterData

class VoiceService:
    def __init__(self):
        # Gemini API 클라이언트 초기화
        if settings.GOOGLE_API_KEY:
            self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)
            self.target_model = "gemini-2.5-flash-lite"
            print(f"✅ 보이스 서비스: Gemini 준비 완료 (Target: {self.target_model})")
        else:
            self.client = None
            print("⚠️ 보이스 서비스: GOOGLE_API_KEY가 없어 AI 번역/에티켓 해설 기능을 사용할 수 없습니다.")
            
        # Whisper 모델 지연 로드 (Lazy Loading)로 초기 구동 속도 및 메모리 절약
        self.whisper_model = None

    def _get_whisper_model(self):
        if self.whisper_model is None:
            print("🔊 Whisper 모델 로드 중 (base)...")
            self.whisper_model = whisper.load_model("base")
            print("🔊 Whisper 모델 로드 완료")
        return self.whisper_model

    async def interpret_voice(self, request: VoiceInterpreterRequest) -> VoiceInterpreterData:
        source_text = request.source_text
        
        # Base64 음성 오디오 데이터가 넘어온 경우 STT 우선 처리
        if request.audio_base64:
            try:
                # 1. Base64 접두사(data:audio/...;base64,)가 있는 경우 분리
                match = re.match(r"^data:(audio/[a-zA-Z0-9+.-]+);base64,(.*)$", request.audio_base64)
                if match:
                    mime_type = match.group(1)
                    raw_base64 = match.group(2)
                else:
                    mime_type = "audio/webm"  # 기본값
                    raw_base64 = request.audio_base64
                    
                audio_bytes = base64.b64decode(raw_base64.strip())
                
                # MIME 타입별 오디오 확장자 판별
                ext = "webm"
                if "mp4" in mime_type:
                    ext = "mp4"
                elif "wav" in mime_type:
                    ext = "wav"
                elif "ogg" in mime_type:
                    ext = "ogg"
                elif "mpeg" in mime_type:
                    ext = "mp3"
                    
                # 2. 분석을 위해 오디오 데이터를 임시 파일로 디스크에 저장
                temp_file_path = f"/tmp/temp_voice_interpret.{ext}"
                with open(temp_file_path, "wb") as f:
                    f.write(audio_bytes)
                    
                # 3. Whisper STT 처리
                model = self._get_whisper_model()
                print(f"🔊 STT 음성 인식 시작 (파일 경로: {temp_file_path})...")
                result = model.transcribe(temp_file_path)
                source_text = result.get("text", "").strip()
                print(f"🔊 STT 결과 인식 텍스트: {source_text}")
                
            except Exception as e:
                print(f"❌ Whisper STT 처리 에러: {e}")
                source_text = "음성 인식이 실패했습니다. (마이크 녹음 상태를 확인해 주세요)"
            finally:
                # 임시 파일 명시적 삭제
                if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
                    os.remove(temp_file_path)

        # 텍스트가 없는 경우 에러 전파 방지 기본값 반환
        if not source_text or not source_text.strip():
            return VoiceInterpreterData(
                translated_text="인식된 대화가 없습니다.",
                intent_analysis="아무 소리도 들리지 않았거나 무음 상태였습니다.",
                cultural_context="마이크 소리나 주변 환경을 점검하고 다시 녹음해 주세요.",
                suggested_reply_ko="다시 한 번 말씀해 주시겠어요?",
                suggested_reply_audio_url=None
            )

        if not self.client:
            return VoiceInterpreterData(
                translated_text=source_text,
                intent_analysis="AI 인증 키가 누락되어 상황 분석을 수행할 수 없습니다.",
                cultural_context="서버 측 GOOGLE_API_KEY 환경변수가 설정되어 있는지 확인해주세요.",
                suggested_reply_ko="API Key 미설정",
                suggested_reply_audio_url=None
            )

        # 4. Gemini 1.5 Flash를 사용하여 언어 감지, 번역, 에티켓 해설, 답변 템플릿 생성
        prompt = f"""
[역할]
당신은 여행 중인 한국인 사용자를 돕는 실시간 AI 통역사이자 문화 에티켓 가이드입니다.
사용자가 녹음한 음성 또는 텍스트 입력('{source_text}')을 분석하여 현지 번역 정보와 에티켓 가이드, 추천 답변 템플릿을 생성하세요.

[사용자 위치 정보]
현재 위치: {request.user_location}

[입력된 원본 텍스트]
{source_text}

[임무]
1. 원본 텍스트의 언어를 감지하여 정확하고 자연스러운 한국어로 번역하세요 (이미 한국어인 경우 현지 해당 언어로 번역). 이 번역 결과를 'translated_text' 필드에 작성하세요.
2. 텍스트의 상황을 유추하여 말하는 이(현지 종업원, 길 안내자 등)의 의도나 상황을 'intent_analysis' 필드에 분석해 적어주세요. (예: "식당 종업원이 뜨거운 음식이 나오니 주의해 달라고 말하는 고마운 경고 상황입니다.")
3. 사용자의 현재 위치('{request.user_location}')를 토대로, 본 대화 상황과 연관된 현지 문화적 매너, 행동 팁, 에티켓 정보를 'cultural_context' 필드에 친절하게 작성하세요. (예: "일본 식당에서는 종업원이 직접 음식을 내려놓기 전에 손을 뻗어 가져가면 매너에 어긋날 수 있으니 주의해 주세요.")
4. 이 상황에서 사용자가 현지인에게 대답하기 가장 좋고 정중한 답변 템플릿을 추천 한국어 한글 발음 및 뜻과 함께 'suggested_reply_ko' 필드에 작성하세요. (예: "감사합니다. (아리가토 고자이마스)")

반드시 모든 답변을 명확한 한국어로 작성하여 완성도 높은 가이드를 반환하세요.
"""

        try:
            response = self.client.models.generate_content(
                model=self.target_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=VoiceInterpreterData,
                )
            )
            return VoiceInterpreterData.model_validate_json(response.text)
        except Exception as e:
            print(f"❌ Gemini voice interpreter 호출 에러: {e}")
            return VoiceInterpreterData(
                translated_text=f"번역 실패: {source_text}",
                intent_analysis="일시적인 AI 서버 오류로 상황을 판단할 수 없습니다.",
                cultural_context="Gemini API 호출 제한 또는 네트워크 장애가 발생했을 수 있습니다.",
                suggested_reply_ko="잠시 후 다시 시도해 주세요.",
                suggested_reply_audio_url=None
            )
