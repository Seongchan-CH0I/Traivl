from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

class TravelRequest(BaseModel):
    destinations: List[str]
    preferences: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "Welcome to Traivl AI Engine"}

@app.post("/recommend")
def get_recommendations(request: TravelRequest):
    # TSP 알고리즘이나 LLM 추론 로직이 들어갈 자리입니다.
    # 현재는 예시 데이터를 반환합니다.
    return {
        "recommended_path": request.destinations[::-1], # 간단히 역순으로 반환 예시
        "message": f"'{request.preferences}' 취향을 반영한 최적의 경로입니다."
    }