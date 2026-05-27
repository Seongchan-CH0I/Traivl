from fastapi import APIRouter, File, UploadFile
import os
import whisper
from app.models.voice_model import VoiceInterpreterRequest, VoiceInterpreterResponse, VoiceInterpreterData

from app.services.voice_service import VoiceService

router = APIRouter()
voice_service = VoiceService()

@router.post("/interpreter", response_model=VoiceInterpreterResponse, summary="실시간 통역기반 에티켓 해설", description="사용자 대화나 텍스트를 분석해 현지 문화와 언어로 된 번역, 의도, 응답 예시(가이드) 등을 제공합니다.")
async def voice_interpreter(request: VoiceInterpreterRequest):
    try:
        data = await voice_service.interpret_voice(request)
        return VoiceInterpreterResponse(status="success", data=data)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"실시간 통역 및 음성 해설 도중 서버 오류가 발생했습니다: {str(e)}")

@router.post("/stt-test", summary="STT 독립 테스트용 API", description="프론트 연동 없이 AI 백엔드에서 음성 파일(.wav, .mp3, .m4a)을 바로 업로드하여 텍스트 변환 결과를 확인합니다.")
async def test_stt_upload(file: UploadFile = File(...)):
    # 1. 업로드된 파일 임시 저장
    temp_file_path = f"/tmp/{file.filename}"
    with open(temp_file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    try:
        # 2. Whisper 모델 로드 ('tiny'나 'base'는 속도가 빠릅니다)
        print("Whisper 모델 로딩 중...")
        model = whisper.load_model("base")
        
        # 3. 음성 파일 변환 (STT)
        print("음성 인식 중...")
        result = model.transcribe(temp_file_path)
        
        return {
            "success": True,
            "filename": file.filename,
            "transcription": result["text"]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        # 임시 파일 삭제
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
