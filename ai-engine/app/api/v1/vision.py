from fastapi import APIRouter, HTTPException
from app.models.vision_model import VisionLensRequest, VisionLensResponse
from app.services.vision_service import VisionService

router = APIRouter()
vision_service = VisionService()

@router.post("/lens", response_model=VisionLensResponse, summary="실시간 스마트 렌즈", description="추출된 텍스트나 압축된 이미지를 바탕으로 번역 및 현지 상황에 맞는 기내/관광지 에티켓을 해설합니다.")
async def vision_lens(request: VisionLensRequest):
    try:
        data = await vision_service.vision_lens(request)
        return VisionLensResponse(status="success", data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"스마트 렌즈 분석 도중 서버 오류가 발생했습니다: {str(e)}")

