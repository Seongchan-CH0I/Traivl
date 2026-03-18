from pydantic import BaseModel
from typing import Optional

# ==========================================
# 4. /voice/interpreter 관련 모델
# ==========================================
class VoiceInterpreterRequest(BaseModel):
    user_location: str
    source_text: Optional[str] = None
    audio_base64: Optional[str] = None

class VoiceInterpreterData(BaseModel):
    translated_text: str
    intent_analysis: str
    cultural_context: str
    suggested_reply_ko: str
    suggested_reply_audio_url: Optional[str] = None

class VoiceInterpreterResponse(BaseModel):
    status: str
    data: VoiceInterpreterData
