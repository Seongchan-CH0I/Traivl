from fastapi import APIRouter, HTTPException
from app.models.plan_model import PlanRequest, PlanResponse
from app.services.plan_service import plan_service

router = APIRouter()

@router.post("/recommend", response_model=PlanResponse, summary="맞춤형 여행 코스 기획", description="유저 취향, 대륙, 국가, 목적지 등을 기반으로 일차별 타임라인 중심의 여행 코스를 생성합니다.")
async def recommend_travel_plan(request: PlanRequest):
    try:
        # 실제 AI 서비스 호출
        result = await plan_service.get_recommended_plan(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

