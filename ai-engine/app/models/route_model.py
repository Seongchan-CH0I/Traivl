from pydantic import BaseModel
from typing import List

# ==========================================
# 2. /route/optimize 관련 모델
# ==========================================
class Location(BaseModel):
    lat: float
    lng: float

class PlaceVisitItem(BaseModel):
    place_id: str
    lat: float
    lng: float
    stay_duration_mins: int

class RouteOptimizeRequest(BaseModel):
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
