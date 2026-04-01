# app/services/plan_service.py 수정본 제안
import os
import math # 거리 계산용
from typing import List, Dict, Any
from app.models.plan_model import PlanRequest, PlanResponse, PlanData, DayItinerary, PlaceItem, PlaceCandidate
from app.core.config import settings

# LangChain Chroma 관련 임포트 
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma


# 🧮 두 위도/경도 간의 직선거리를 km 단위로 계산하는 공식 (Haversine)
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371.0 # 지구 반지름 (km)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class PlanService:
    def __init__(self):
        # [주석] 추후 OpenAI API 도입 여부가 확정되면 여기서 클라이언트를 초기화합니다.
        pass

    async def get_recommended_plan(self, request: PlanRequest) -> PlanResponse:
        """
        사용자 요청에 따라 추천 여행 계획을 생성합니다.
        """
        
        # [STEP 1] 프론트엔드의 취향(travel_style)을 검색 쿼리로 변환
        search_query = f"{', '.join(request.travel_style)} 분위기가 가득한 장소"  
        
        # 유저의 여행일수에 따라 검색할 K(개수)를 동적으로 계산!
        travel_days = request.duration.days if request.duration.days > 0 else 1 # 최소 1일 보장
        
        # 하루 평균 3군데씩 간다고 치고, 혹시 몰라 여유분(버퍼)으로 2군데 더 뽑음
        dynamic_k = (travel_days * 3) + 2 
        
        # 아무리 길어도 25개를 넘지 못하게, 최소 3개는 뽑게 설정
        dynamic_k = max(3, min(dynamic_k, 25))


        print(f"🔍 [벡터 DB 검색] 쿼리: {search_query} | 여행일수: {travel_days}일 -> 목표 장소 개수: {dynamic_k}개")
        # [STEP 2] 내부 로컬 Chroma DB에서 유사 장소 RAG 검색 (test_real_ingestion.py 로직)
        results = self.vector_db.similarity_search(
            query=search_query, 
            k=dynamic_k,         # 여행일자에 맞게 계산된 유동 변수
            filter={"destination": request.destination}
        )
        candidates = []
        for doc in results:
            meta = doc.metadata
            candidates.append(
                PlaceCandidate(
                    place_id=meta['place_id'],
                    title=meta['name'],
                    description=doc.page_content, # 해당 장소 설명
                    tags=[],
                    lat=meta['lat'],
                    lng=meta['lng'],
                    stay_duration_mins=meta['duration_mins']
                )
            )
        # 
        # TODO: 추후 K-Means 클러스터링을 도입하여 여행 일자별(Day) 지역군으로 묶은 뒤
        # 같은 그룹 내에서의 거리만 정밀하게 판별하도록 로직을 고도화할 예정이므로 임시 주석 처리합니다.
     


        # TODO: OpenAI API 연동 및 일정표 생성기
        # 현 시점에서는 프론트엔드 연동(시간표 UI)이나 OpenAI API 사용 여부를 
        # 고려하지 않으므로, 복잡한 포장 로직 없이 빈 일정표를 반환합니다.
        # (검색된 후보군은 콘솔 출력이나 내부 계산용으로만 사용됩니다)
        # ---------------------------------------------------------------------

        return PlanResponse(
            status="success",
            data=PlanData(
                course_title=f"{request.user_name}님의 취향을 담은 {request.destination} 여행",
                course_subtitle=f"DB 검색 완료 (총 {len(candidates)}개의 명소 발견)",
                itinerary=[]  # 가짜 시간표 포장을 제거하고 빈 리스트 반환
            )
        )

plan_service = PlanService()
