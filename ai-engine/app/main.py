from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

# API 엔드포인트 임포트 (나중에 추가)
# from app.api.v1 import chat, vision, voice, route

app = FastAPI(title="Traivl AI Engine API", version="1.0.0")

class TravelRequest(BaseModel):
    destinations: List[str]
    preferences: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "Welcome to Traivl AI Engine Service"}

@app.post("/recommend")
def get_recommendations(request: TravelRequest):
    # TSP 알고리즘이나 LLM 추론 로직이 들어갈 자리입니다.
    # 현재는 예시 데이터를 반환합니다.
    return {
        "recommended_path": request.destinations[::-1], # 간단히 역순으로 반환 예시
        "message": f"'{request.preferences}' 취향을 반영한 최적의 경로입니다."
    }

# 향후 추가될 엔드포인트들의 예시 (v1 아래에 작성하는 것을 권장)
@app.post("/api/v1/chat")
async def chat_endpoint(message: str):
    return {"reply": f"챗봇 답변: {message}에 대한 답변입니다."}

@app.post("/api/v1/ocr")
async def ocr_endpoint():
    return {"text": "이미지 분석 결과(OCR)입니다."}

@app.post("/api/v1/stt")
async def stt_endpoint():
    return {"text": "음성 인식 결과(STT)입니다."}
