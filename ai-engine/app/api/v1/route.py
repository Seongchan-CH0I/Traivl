from fastapi import APIRouter, HTTPException
from app.models.route_model import RouteOptimizeRequest, RouteOptimizeResponse
from app.services.route_service import route_service

router = APIRouter()

@router.post("/optimize", response_model=RouteOptimizeResponse, summary="여행 경로 최적화", description="사용자가 선택한 여행 장소들의 목록을 받아 효율적인 동선으로 정렬해 반환합니다.")
async def optimize_route(request: RouteOptimizeRequest):
    try:
        # 실제 경로 최적화 서비스 호출
        result = await route_service.optimize_route(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
