import os
import math # 거리 계산용
import json
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
        """
        초기화: 임베딩 모델과 벡터 DB(Chroma)를 로드합니다. (TODO 해결!)
        """
        # OpenAI API 키 설정 (추후 입력 대기)
        # self.client = OpenAI(api_key=settings.OPENAI_API_KEY) 

        # 한국어 임베딩 모델 로드
        self.embeddings_model = HuggingFaceEmbeddings(model_name="jhgan/ko-sbert-nli")
        
        # 벡터 DB 경로 설정 및 로드 (프로젝트 루트의 chroma_real_db를 찾도록 상위로 한 단계 더 이동)
        self.persist_directory = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "chroma_real_db")
        
        if os.path.exists(self.persist_directory):
            self.vector_db = Chroma(
                persist_directory=self.persist_directory,
                embedding_function=self.embeddings_model
            )
            print(f"✅ 벡터 DB 로드 완료: {self.persist_directory}")
        else:
            print(f"⚠️ 경고: 벡터 DB를 찾을 수 없습니다. (경로: {self.persist_directory})")
            self.vector_db = None

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
        # 구글이 준 '절대 변하지 않는 고유 ID(place_id)' 활용
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
                    stay_duration_mins=meta.get('duration_mins', 90)
                )
            )

        # 지능형 장소 선정 (1차: 룰 기반 가중치 선정)
        # TODO: 추후 OpenAI API 연결 시 GPT-4o가 여기서 최종 결정을 내립니다.
        selected_places = self._select_best_places(candidates, request, count=travel_days * 4)

        # 진짜 시간표 생성 (itinerary 시뮬레이션)
        itinerary = self._simulate_itinerary(selected_places, request.duration)

        return PlanResponse(
            status="success",
            data=PlanData(
                course_title=f"{request.user_name}님의 취향을 담은 {request.destination} 여행",
                course_subtitle=f"AI가 {len(candidates)}개의 후보 중 전수 조사하여 완성했습니다.",
                itinerary=itinerary  # 드디어 빈 리스트가 아닌 진짜 일정이 나갑니다!
            )
        )

    def _select_best_places(self, candidates: List[PlaceCandidate], request: PlanRequest, count: int) -> List[PlaceCandidate]:
        """
        검색된 후보지 중 유저 성향에 맞는 최적의 장소를 선정합니다.
        (RAG 검색 결과 상위권을 기반으로 개수를 조절하는 방식)
        """
        # TODO: 유저 DNA 태그 일치 여부에 따른 정렬 가중치 추가 가능
        return candidates[:count]

    def _simulate_itinerary(self, places: List[PlaceCandidate], duration: Any) -> List[DayItinerary]:
        """
        선정된 장소들을 여행 일자별 타임라인으로 배분합니다.
        """
        days = []
        places_per_day = max(1, math.ceil(len(places) / duration.days))
        
        for d in range(1, duration.days + 1):
            start_idx = (d-1) * places_per_day
            end_idx = min(d * places_per_day, len(places))
            day_places = places[start_idx:end_idx]
            
            if not day_places: break
            
            day_items = [
                PlaceItem(
                    place_id=p.place_id,
                    suggested_time=f"{10 + i*3}:00", # 임시 시간 배정 (10시부터 3시간 간격)
                    title=p.title,
                    location="AI 추천 장소" # 추후 GPT-4o의 설명으로 대체
                ) for i, p in enumerate(day_places)
            ]
            days.append(DayItinerary(day=d, places=day_items))
            
        return days

plan_service = PlanService()
