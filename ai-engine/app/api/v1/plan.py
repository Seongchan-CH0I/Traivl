from fastapi import APIRouter
from app.models.plan_model import PlanRequest, PlanResponse, PlanData, DayItinerary, PlaceItem

router = APIRouter()

@router.post("/recommend", response_model=PlanResponse, summary="맞춤형 여행 코스 기획", description="유저 취향, 대륙, 국가, 목적지 등을 기반으로 일차별 타임라인 중심의 여행 코스를 생성합니다.")
async def recommend_travel_plan(request: PlanRequest):
    # TODO: AI 연동 로직 (현재는 Mock 데이터 반환)
    
    mock_data = PlanResponse(
        status="success",
        data=PlanData(
            course_title=f"{request.user_name}님의 취향을 듬뿍 담은 {request.destination} 힐링 코스",
            course_subtitle=f"Your {request.destination} Heritage Route",
            itinerary=[
                DayItinerary(
                    day=1,
                    places=[
                        PlaceItem(
                            place_id="p001",
                            suggested_time="14:00",
                            title="전통 거리 산책",
                            location="시내 중심가"
                        ),
                        PlaceItem(
                            place_id="p002",
                            suggested_time="16:00",
                            title="유명 사찰 관람",
                            location="시내 외곽"
                        )
                    ]
                )
            ]
        )
    )
    return mock_data
