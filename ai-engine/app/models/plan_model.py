from pydantic import BaseModel
from typing import List, Optional

# ==========================================
# 1. /plan/recommend 관련 모델
# ==========================================
class Duration(BaseModel):
    days: int
    nights: int

class PlaceCandidate(BaseModel):
    place_id: str
    title: str
    description: Optional[str] = None
    tags: List[str] = []
    category: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    stay_duration_mins: int = 60

class PlanRequest(BaseModel):
    user_id: str
    user_name: str
    continent: str
    country: str
    destination: str
    duration: Duration
    travel_style: List[str]
    dna_type: Optional[str] = None
    candidates: List[PlaceCandidate] = [] # Node.js 백엔드에서 필터링해서 보내줄 후보군

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
