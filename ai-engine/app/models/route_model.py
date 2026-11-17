from pydantic import BaseModel
from typing import List

# ==========================================
# 2. /route/optimize 관련 모델
# ==========================================
class Location(BaseModel):
    lat: float
    lng: float
    stay_duration_mins: int = 90
    opening_hours: List[int] = [540, 570] # 09:00 ~ 09:30 출발 시간대

class PlaceVisitItem(BaseModel):
    place_id: str
    lat: float
    lng: float
    stay_duration_mins: int
    opening_hours: List[int] = [0, 1440] # [시작인덱스분, 종료인덱스분] 기본값 하루 전체

class RouteOptimizeRequest(BaseModel):
    destination: str = "kanto"
    start_location: Location
    places_to_visit: List[PlaceVisitItem]
    max_days: int

class RouteStep(BaseModel):
    step: int
    place_id: str
    expected_arrival: str

class OptimizedRouteDay(BaseModel):
    day: int
    total_travel_time_mins: int
    route: List[RouteStep]

class RouteOptimizeData(BaseModel):
    optimized_routes: List[OptimizedRouteDay]

class RouteOptimizeResponse(BaseModel):
    status: str
    data: RouteOptimizeData
