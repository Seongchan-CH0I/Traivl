from fastapi import APIRouter
from app.models.vision_model import VisionLensRequest, VisionLensResponse, VisionLensData

router = APIRouter()

@router.post("/lens", response_model=VisionLensResponse, summary="실시간 스마트 렌즈", description="추출된 텍스트나 압축된 이미지를 바탕으로 번역 및 현지 상황에 맞는 기내/관광지 에티켓을 해설합니다.")
async def vision_lens(request: VisionLensRequest):
    # TODO: OCR 결과 처리 및 LLM 프롬프트 분석 연동 (현재는 Mock 데이터)
    mock_data = VisionLensResponse(
        status="success",
        data=VisionLensData(
            identified_type="식당 메뉴",
            translated_text="특제 돈코츠 라멘",
            explanation="돼지 뼈를 진하게 우려낸 뽀얀 국물의 전통 라면입니다.",
            cultural_context="일본 라면집에서는 국물을 마실 때 그릇째 들고 마시는 것이 자연스러운 문화입니다."
        )
    )
    return mock_data# TODO: 사진 분석 & OCR 관련 엔드포인트 구현
