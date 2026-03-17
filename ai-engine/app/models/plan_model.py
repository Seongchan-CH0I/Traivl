from pydantic import BaseModel
from typing import List, Optional

# ==========================================
# 1. /plan/recommend 관련 모델
# ==========================================
class Duration(BaseModel):
    days: int
    nights: int

class PlanRequest(BaseModel):
    user_id: int
    user_name: str
    continent: str
    country: str
    destination: str
    duration: Duration
    travel_style: List[str]

class PlaceItem(BaseModel):
    place_id: str
    suggested_time: str
    title: str
    location: str

class DayItinerary(BaseModel):
    day: int
    places: List[PlaceItem]

class PlanData(BaseModel):
    course_title: str
    course_subtitle: str
    itinerary: List[DayItinerary]

class PlanResponse(BaseModel):
    status: str
    data: PlanData
