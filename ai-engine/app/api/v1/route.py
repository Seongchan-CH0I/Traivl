from fastapi import APIRouter
from app.models.route_model import RouteOptimizeRequest, RouteOptimizeResponse, RouteOptimizeData, OptimizedRouteDay, RouteStep

router = APIRouter()

@router.post("/optimize", response_model=RouteOptimizeResponse, summary="여행 경로 최적화", description="사용자가 선택한 여행 장소들의 목록을 받아 효율적인 동선으로 정렬해 반환합니다.")
async def optimize_route(request: RouteOptimizeRequest):
    # TODO: Google OR-Tools 등 경로 최적화 알고리즘 연동 (현재는 Mock 데이터)
    mock_data = RouteOptimizeResponse(
        status="success",
        data=RouteOptimizeData(
            optimized_routes=[
                OptimizedRouteDay(
                    day=1,
                    total_travel_time_mins=120,
                    route=[
                        RouteStep(step=1, place_id="START_POINT", expected_arrival="09:00"),
                        RouteStep(step=2, place_id=request.places_to_visit[0].place_id if request.places_to_visit else "p001", expected_arrival="09:30")
                    ]
                )
            ]
        )
    )
    return mock_data# TODO: 여행 경로 최적화 엔드포인트 구현
