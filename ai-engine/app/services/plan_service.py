import os
import math # 거리 계산 및 일정 배분용
import json
import numpy as np
from typing import List, Dict, Any
from sklearn.cluster import KMeans
from google import genai
from google.genai import types

from app.models.plan_model import PlanRequest, PlanResponse, PlanData, DayItinerary, PlaceItem, PlaceCandidate
from app.models.route_model import RouteOptimizeRequest, PlaceVisitItem, Location
from app.services.route_service import route_service
from app.core.config import settings

# LangChain DB 관련 임포트 
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores.pgvector import PGVector

# 🧮 두 위도/경도 간의 직선거리를 km 단위로 계산하는 공식 (Haversine)
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371.0 # 지구 반지름 (km)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# 🏡 DB가 없거나 통신이 실패할 때 사용할 로컬 백업 장소 데이터 (Mock Fallback)
MOCK_PLACES = {
    "교토": [
        {"place_id": "mock_kyoto_1", "title": "기요미즈데라", "description": "교토의 상징적인 절벽 사찰입니다.", "lat": 34.994, "lng": 135.785},
        {"place_id": "mock_kyoto_2", "title": "금각사", "description": "황금빛 누각이 아름다운 사찰입니다.", "lat": 35.039, "lng": 135.729},
        {"place_id": "mock_kyoto_3", "title": "은각사", "description": "고즈넉한 모래 정원이 있는 사찰입니다.", "lat": 35.026, "lng": 135.798},
        {"place_id": "mock_kyoto_4", "title": "아라시야마", "description": "대나무 숲길이 우거진 자연명소입니다.", "lat": 35.009, "lng": 135.667},
        {"place_id": "mock_kyoto_5", "title": "이나리대샤", "description": "붉은 도리이 터널로 유명한 신사입니다.", "lat": 34.967, "lng": 135.772},
    ],
    "오키나와": [
        {"place_id": "mock_okinawa_1", "title": "츄라우미 수족관", "description": "거대한 고래상어가 있는 아쿠아리움입니다.", "lat": 26.694, "lng": 127.877},
        {"place_id": "mock_okinawa_2", "title": "만좌모", "description": "코끼리 모양의 기암절벽 해안 명소입니다.", "lat": 26.504, "lng": 127.858},
        {"place_id": "mock_okinawa_3", "title": "아메리칸 빌리지", "description": "미국풍 거리와 관람차가 있는 쇼핑몰입니다.", "lat": 26.315, "lng": 127.755},
        {"place_id": "mock_okinawa_4", "title": "국제거리", "description": "나하시 중심가의 쇼핑과 미식 거리입니다.", "lat": 26.215, "lng": 127.685},
    ],
    "속초": [
        {"place_id": "mock_sokcho_1", "title": "설악산 국립공원", "description": "웅장한 암반과 케이블카가 있는 명산입니다.", "lat": 38.161, "lng": 128.465},
        {"place_id": "mock_sokcho_2", "title": "속초 관광수산시장", "description": "닭강정과 해산물이 맛있는 전통시장입니다.", "lat": 38.204, "lng": 128.590},
        {"place_id": "mock_sokcho_3", "title": "영금정", "description": "파도 소리가 거문고 소리처럼 들리는 정자입니다.", "lat": 38.212, "lng": 128.601},
        {"place_id": "mock_sokcho_4", "title": "아바이마을", "description": "갯배를 타고 갈 수 있는 전통 순대 마을입니다.", "lat": 38.202, "lng": 128.593},
    ],
    "도쿄": [
        {"place_id": "mock_tokyo_1", "title": "도쿄 타워", "description": "도쿄의 상징적인 붉은 전망 타워입니다.", "lat": 35.658, "lng": 139.745},
        {"place_id": "mock_tokyo_2", "title": "센소지", "description": "아사쿠사에 위치한 도쿄에서 가장 오래된 절입니다.", "lat": 35.714, "lng": 139.796},
        {"place_id": "mock_tokyo_3", "title": "시부야 스카이", "description": "시부야 교차로를 한눈에 내려다보는 전망대입니다.", "lat": 35.658, "lng": 139.701},
        {"place_id": "mock_tokyo_4", "title": "신주쿠 교엔", "description": "도심 속 드넓은 정원과 온실 공원입니다.", "lat": 35.685, "lng": 139.709},
    ]
}

class PlanService:
    def __init__(self):
        # Google Gemini API 설정 (최신 v1.0 SDK 적용)
        if settings.GOOGLE_API_KEY:
            self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)
            self.target_model = "gemini-3.5-flash"
            print(f"✅ 플랜 서비스: Gemini 3.5 Flash 준비 완료 (Target: {self.target_model})")
        else:
            self.client = None
            print("⚠️ GOOGLE_API_KEY가 없어 AI 기능을 사용할 수 없습니다.")

        # PostgreSQL(pgvector) 연동 초기화 설정 (환경 변수 사용)
        db_url = settings.DATABASE_URL
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

        embeddings_model = HuggingFaceEmbeddings(model_name="jhgan/ko-sbert-nli")
        
        self.vector_db = PGVector(
            collection_name="travel_places",
            connection_string=db_url,
            embedding_function=embeddings_model
        )

    async def get_recommended_plan(self, request: PlanRequest) -> PlanResponse:
        
        # 1. 사용자가 선택한 태그를 쿼리로 변환
        search_query = f"{', '.join(request.travel_style)} 분위기가 가득한 장소"  
        
        # 유저의 여행일수에 따라 검색할 K(개수)를 동적으로 계산!
        travel_days = request.duration.days if request.duration.days > 0 else 1 # 최소 1일 보장
        
        # 하루 평균 3군데씩 간다고 치고, 혹시 몰라 여유분(버퍼)으로 2군데 더 뽑음
        dynamic_k = (travel_days * 3) + 2 

        print(f"🔍 [벡터 DB 검색] 쿼리: {search_query} | 여행일수: {travel_days}일 -> 목표 장소 개수: {dynamic_k}개")
        # 2. PostgreSQL(pgvector)에서 유사 장소 RAG 검색 (DB가 완전히 오프라인 상태여도 성공하도록 폴백 처리)
        candidates = []
        try:
            results = self.vector_db.similarity_search(
                query=search_query,                         # 유저가 선택한 여행 스타일
                k=dynamic_k,                                # 여행일자에 맞게 계산된 유동 변수
                filter={"destination": request.destination} # 유저가 선택한 도시
            )
            for doc in results:
                meta = doc.metadata
                candidates.append(
                    PlaceCandidate(
                        place_id=meta['place_id'],
                        title=meta['name'],
                        description=doc.page_content, # 해당 장소 설명
                        tags=[],
                        category=meta.get('category', '명소'),
                        lat=meta['lat'],
                        lng=meta['lng'],
                        stay_duration_mins=meta.get('duration_mins', 90)
                    )
                )
        except Exception as db_err:
            print(f"❌ [벡터 DB 검색 실패]: {db_err}. 로컬 백업 데이터로 대체를 시작합니다.")

        # RAG 검색 결과가 없거나 DB 오류 시 로컬 Mock 데이터로 채워서 실패 예방
        if not candidates:
            print("⚠️ [Plan] 사용 가능한 검색 결과가 없어 백업 장소 데이터를 로드합니다.")
            city_key = request.destination.replace("JP_", "").replace("KR_", "")
            
            mock_list = []
            for k, v in MOCK_PLACES.items():
                if k in request.destination or request.destination in k:
                    mock_list = v
                    break
            if not mock_list:
                mock_list = MOCK_PLACES["도쿄"]
                
            for mock_item in mock_list:
                candidates.append(
                    PlaceCandidate(
                        place_id=mock_item['place_id'],
                        title=mock_item['title'],
                        description=mock_item['description'],
                        tags=[],
                        category="명소",
                        lat=mock_item['lat'],
                        lng=mock_item['lng'],
                        stay_duration_mins=90
                    )
                )

        # [2단계] Gemini를 이용한 지능형 장소 선정 및 추천 사유 생성
        target_count = travel_days * 3 # 하루 3군데 기준
        selected_data = await self._select_places_with_gemini(candidates, request, count=target_count)

        # [3단계] 최종 시간표 생성 (itinerary 시뮬레이션)
        # Gemini가 선정한 장소들을 K-Means 클러스터링과 OSRM 경로최적화로 시간표를 구성합니다.
        itinerary = await self._simulate_itinerary_v2(selected_data, request.duration)

        return PlanResponse(
            status="success",
            data=PlanData(
                course_title=f"{request.user_name}님의 취향을 담은 {request.destination} 여행",
                course_subtitle=f"AI가 선정한 장소를 OSRM 경로 최적화로 완벽하게 배치했습니다.",
                itinerary=itinerary  # 드디어 빈 리스트가 아닌 진짜 일정이 나갑니다!
            )
        )

    async def _select_places_with_gemini(self, candidates: List[PlaceCandidate], request: PlanRequest, count: int) -> List[Dict[str, Any]]:
        """
        Gemini 1.5 Flash를 사용하여 유저 취향에 맞는 장소를 선정하고 추천 사유를 생성합니다.
        """
        if not self.client:
            # AI 키가 없을 경우 하위 호환을 위해 상위 N개 반환 (기존 로직)
            return [{"place": c, "reason": "AI 추천 장소"} for c in candidates[:count]]

        # 후보지 정보를 텍스트로 정리
        candidates_text = "\n".join([
            f"- ID: {c.place_id}, 이름: {c.title}, 설명: {c.description}"
            for c in candidates
        ])

        prompt = f"""
당신은 베테랑 여행 가이드입니다. 다음 유저의 성향과 여행 정보를 바탕으로, 후보 장소들 중 가장 적합한 {count}개를 선정하고 일정을 짜주세요.

[유저 정보]
- 이름: {request.user_name}
- 목적지: {request.destination}
- 여행 기간: {request.duration.days}일
- 필수 포함 선호 스타일/테마: {', '.join(request.travel_style)}
- 유저 DNA: {request.dna_type}

[후보 장소 리스트]
{candidates_text}

[중요 임무]
1. 위 유저 성향과 선호 테마({', '.join(request.travel_style)})에 맞는 명소와 맛집/식당/야경 장소를 골고루 조합하여 총 {count}개를 골라주세요.
2. 유저가 '맛집투어'나 '야경투어', '액티비티'를 선택했다면 관련 장소가 반드시 포함되어야 합니다.
3. 각 장소마다 이 유저에게 왜 추천하는지 "1인칭 친절한 가이드 말투"로 유익한 추천 사유를 1~2줄로 작성해 주세요.
4. 반드시 아래 JSON 형식으로만 답변하세요.

JSON 형식:
{{
  "selected_places": [
    {{
      "place_id": "장소 ID",
      "reason": "개인화된 추천 사유"
    }}
  ]
}}
"""
        try:
            # 자동 감지된 최적의 모델 ID를 사용하여 호출
            response = self.client.models.generate_content(
                model=self.target_model,
                contents=prompt
            )
            # 인공지능이 설명 문구를 붙여도 JSON만 쏙 골라내도록 전처리
            raw_text = response.text.strip()
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
            
            data = json.loads(raw_text.strip())
            
            # 결과 매핑
            selected_ids = {item['place_id']: item['reason'] for item in data.get('selected_places', [])}
            result = []
            for c in candidates:
                if c.place_id in selected_ids:
                    result.append({"place": c, "reason": selected_ids[c.place_id]})
            
            return result[:count] if result else [{"place": c, "reason": c.description or f"{c.title}의 매력을 깊이 경험할 수 있는 추천 장소입니다."} for c in candidates[:count]]
        except Exception as e:
            print(f"❌ Gemini 호출 오류: {e}")
            return [{"place": c, "reason": c.description or f"{c.title}의 매력을 깊이 경험할 수 있는 추천 장소입니다."} for c in candidates[:count]]

    async def _simulate_itinerary_v2(self, selected_data: List[Dict[str, Any]], duration: Any) -> List[DayItinerary]:
        """
        Gemini가 선정한 장소들을 K-Means 공간 밀도 및 OSRM 지리적 거리에 기반하여 (2개~4개)로 동적 배분합니다.
        """
        if not selected_data:
            return []

        days_count = duration.days
        coords = np.array([[item['place'].lat, item['place'].lng] for item in selected_data])
        
        # 1. K-Means 공간 클러스터링으로 지리적 1차 그룹화
        if len(selected_data) >= days_count:
            kmeans = KMeans(n_clusters=days_count, random_state=42, n_init=10)
            labels = kmeans.fit_predict(coords)
        else:
            labels = [i % days_count for i in range(len(selected_data))]
            
        raw_clusters = {i: [] for i in range(days_count)}
        for i, label in enumerate(labels):
            raw_clusters[label].append(selected_data[i])

        # 2. Spatial Density Adaptive Dynamic Balancer (공간 밀도 및 지리적 반경 기반 동적 밸런싱)
        clusters = {i: [] for i in range(days_count)}
        for d in range(days_count):
            c_items = raw_clusters[d]
            if not c_items:
                continue
            # 클러스터 지리적 분산(반경) 계산
            if len(c_items) > 1:
                c_coords = np.array([[it['place'].lat, it['place'].lng] for it in c_items])
                center = c_coords.mean(axis=0)
                mean_dist = np.mean(np.sqrt(np.sum((c_coords - center)**2, axis=1))) * 111.0 # 약 km 변환
            else:
                mean_dist = 0.0

            # 공간 밀도에 따른 동적 정원 결정 (밀집 구역 4개, 보통 3개, 광역 2개)
            if mean_dist <= 3.0 and len(c_items) >= 4:
                target_capacity = 4
            elif mean_dist >= 8.0:
                target_capacity = 2
            else:
                target_capacity = 3
                
            clusters[d] = c_items[:target_capacity]

        # 잉여 장소들은 가장 여유로운 일차로 동적 할당
        used_ids = {it['place'].place_id for d in clusters for it in clusters[d]}
        leftover = [it for it in selected_data if it['place'].place_id not in used_ids]
        for it in leftover:
            min_day = min(clusters.keys(), key=lambda k: len(clusters[k]))
            clusters[min_day].append(it)

        days = []
        # 2. 각 일자별 TSP 최적화 (RouteService 연동)
        for d in range(duration.days):
            day_batch = clusters.get(d, [])
            if not day_batch: continue
            
            # Route 최적화를 위한 Request 생성 (가상의 첫 장소를 시작점으로)
            start_item = day_batch[0]
            places_to_visit = []
            if len(day_batch) > 1:
                places_to_visit = [
                    PlaceVisitItem(
                        place_id=item['place'].place_id, 
                        lat=item['place'].lat, 
                        lng=item['place'].lng, 
                        stay_duration_mins=item['place'].stay_duration_mins, 
                        opening_hours=[0, 1440]
                    ) for item in day_batch[1:]
                ]
            
            route_req = RouteOptimizeRequest(
                start_location=Location(
                    lat=start_item['place'].lat, 
                    lng=start_item['place'].lng,
                    stay_duration_mins=start_item['place'].stay_duration_mins
                ),
                places_to_visit=places_to_visit,
                max_days=1
            )
            
            print(f"🛣️ [Plan] {d+1}일차 경로 최적화 중... (노드 {len(day_batch)}개)")
            day_items = []
            try:
                route_res = await route_service.optimize_route(route_req)
                if route_res.data.optimized_routes and route_res.data.optimized_routes[0].route:
                    for step in route_res.data.optimized_routes[0].route:
                        pid = start_item['place'].place_id if step.place_id == "START_POINT" else step.place_id
                        matched_item = next((item for item in day_batch if item['place'].place_id == pid), None)
                        if matched_item:
                            day_items.append(PlaceItem(
                                place_id=matched_item['place'].place_id,
                                suggested_time=step.expected_arrival,
                                title=matched_item['place'].title,
                                location=matched_item['reason'], # 기존 Gemini가 쓴 이유 그대로 유지!
                                lat=matched_item['place'].lat,
                                lng=matched_item['place'].lng
                            ))
            except Exception as route_err:
                print(f"❌ [Plan] 경로 최적화 중 에러 발생: {route_err}. 단순 시간 순배치 폴백을 시작합니다.")
            
            if not day_items: # Fallback (혹시 최적화 실패 시 기존 방식)
                for i, item in enumerate(day_batch):
                    day_items.append(PlaceItem(
                        place_id=item['place'].place_id,
                        suggested_time=f"{10 + i * 3}:00",
                        title=item['place'].title,
                        location=item['reason'],
                        lat=item['place'].lat,
                        lng=item['place'].lng
                    ))
                    
            days.append(DayItinerary(day=d+1, places=day_items))
            
        return days

plan_service = PlanService()
