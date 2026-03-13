from fastapi import FastAPI
from app.api.v1 import plan, chat, route, vision, voice

app = FastAPI(
    title="Traivl AI Engine API", 
    version="1.0.0",
    description="Traivl 서비스의 AI 추천 및 분석 엔진 API입니다. (임시 Mock 데이터 연동 중)"
)

# 생성한 API 라우터들을 연동합니다.
app.include_router(plan.router, prefix="/api/v1/plan", tags=["여행 계획(Plan)"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["스마트 비서(Chat)"])
app.include_router(route.router, prefix="/api/v1/route", tags=["경로 최적화(Route)"])
app.include_router(vision.router, prefix="/api/v1/vision", tags=["사진 분석(Vision)"])
app.include_router(voice.router, prefix="/api/v1/voice", tags=["음성 분석(Voice)"])

@app.get("/", tags=["Health Check"]) # 서버 생존용 신고, front_backend 개발자 접속 테스트용
def read_root():
    return {"message": "Welcome to Traivl AI Engine Service!"}
