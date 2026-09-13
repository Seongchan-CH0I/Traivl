from fastapi import APIRouter, HTTPException
from app.models.plan_model import PlanRequest, PlanResponse
from app.core.exceptions import NoPlacesFoundError, VectorSearchError
from app.services.plan_service import plan_service

router = APIRouter()

@router.post("/recommend", response_model=PlanResponse, summary="맞춤형 여행 코스 기획", description="유저 취향, 대륙, 국가, 목적지 등을 기반으로 일차별 타임라인 중심의 여행 코스를 생성합니다.")
async def recommend_travel_plan(request: PlanRequest):
    try:
        # 실제 AI 서비스 호출
        result = await plan_service.get_recommended_plan(request)
        return result
    except NoPlacesFoundError:
        # 데이터가 아직 없는 도시 — 재시도해도 소용없으므로 404로 구분해서 알린다.
        raise HTTPException(
            status_code=404,
            detail=f"'{request.destination}'은(는) 아직 코스를 준비하지 못한 여행지입니다."
        )
    except VectorSearchError:
        # 인프라 장애 — 원인 문자열에 DB 접속 정보가 섞일 수 있어 그대로 노출하지 않는다.
        raise HTTPException(
            status_code=503,
            detail="일시적인 오류로 일정을 만들지 못했습니다. 잠시 후 다시 시도해주세요."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

