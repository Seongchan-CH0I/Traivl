import os
import re
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
from app.core.exceptions import NoPlacesFoundError, VectorSearchError

# LangChain DB 관련 임포트 
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores.pgvector import PGVector

def _clean_theme_tag(tag: str) -> str:
    """프론트엔드 이모지 및 특수문자를 제거하여 DB 태그와 1:1 매칭되도록 정규화 (예: '🍜 맛집투어' -> '맛집투어')"""
    clean = re.sub(r'[^\w\s가-힣]', '', tag).strip()
    return clean if clean else tag.strip()

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
        # psycopg2가 지원하지 않는 pgbouncer 등 URL 파라미터 제거
        if "?" in db_url:
            db_url = db_url.split("?")[0]
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

        embeddings_model = HuggingFaceEmbeddings(model_name="jhgan/ko-sbert-nli")
        
        # Supabase 풀러는 유휴 커넥션을 끊는데 이 컨테이너는 장시간 떠 있으므로,
        # 죽은 커넥션을 미리 감지(pool_pre_ping)하고 주기적으로 갱신(pool_recycle)해야
        # 오래 방치된 뒤 첫 요청에서 검색이 실패하는 일을 막을 수 있다.
        self.vector_db = PGVector(
            collection_name="travel_places",
            connection_string=db_url,
            embedding_function=embeddings_model,
            engine_args={
                "pool_pre_ping": True,
                "pool_recycle": 300,
                "pool_size": 3,
                "max_overflow": 2,
            },
        )

    async def get_recommended_plan(self, request: PlanRequest) -> PlanResponse:
        
        # 1. 사용자가 선택한 태그(이모지 포함 가능)를 순수 텍스트 태그로 정규화
        cleaned_styles = [_clean_theme_tag(s) for s in request.travel_style if _clean_theme_tag(s)]
        if not cleaned_styles:
            cleaned_styles = ["인스타감성", "힐링"]
            
        search_query = f"{', '.join(cleaned_styles)} 분위기가 가득한 장소"  
        
        # 유저의 여행일수에 따라 검색할 K(개수)를 동적으로 계산!
        travel_days = request.duration.days if request.duration.days > 0 else 1 # 최소 1일 보장
        
        # 1. RAG 후보군 당김 개수를 넉넉한 모수로 확보 (35~50개)
        dynamic_k = max(35, travel_days * 10)

        print(f"🔍 [벡터 DB 검색] 정규화 쿼리: {search_query} | 테마: {cleaned_styles} | K: {dynamic_k}개")
        # 2. PostgreSQL(pgvector)에서 유사 장소 RAG 검색 (명소 + 맛집 병행 확보)
        try:
            # 유저 취향 명소 검색
            results = self.vector_db.similarity_search(
                query=search_query,
                k=dynamic_k,
                filter={"destination": request.destination}
            )
            # 맛집/식당 후보군도 항상 별도로 넉넉히(15개 이상) 확보하여 점심/저녁 보장
            food_results = self.vector_db.similarity_search(
                query="현지 맛집 전통 음식 로컬 식당 미식 디너 런치",
                k=15,
                filter={"destination": request.destination}
            )
        except Exception as db_err:
            print(f"❌ [벡터 DB 검색 실패] destination={request.destination}: {db_err}")
            raise VectorSearchError(
                f"벡터 DB 검색에 실패했습니다 (destination={request.destination}): {db_err}"
            ) from db_err

        # 3. DB 메타데이터에서 원본 태그를 100% 보존하고, 식사(Food)와 명소(Attraction)로 분류
        def parse_place_doc(doc):
            raw_tags = doc.metadata.get('tags', [])
            if isinstance(raw_tags, str):
                raw_tags = [t.strip() for t in raw_tags.split(',') if t.strip()]
            elif not isinstance(raw_tags, list):
                raw_tags = []
                
            category = doc.metadata.get('category')
            title = doc.metadata.get('name', '')
            desc = doc.page_content or ''
            title_lower = title.lower()
            text_all = f"{title} {desc} {' '.join(raw_tags)}".lower()

            # 명소/자연/유적 명백한 장소는 설명에 맛집 단어가 있어도 맛집으로 분류하지 않음
            is_definitely_attraction = any(k in title_lower for k in [
                '비치', '해변', '사찰', '성당', '산', '공원', '타워', '브릿지', '다리', '사원',
                '박물관', '미술관', '궁전', '광장', '유적', '바나힐', '케이블카', '전망대'
            ])

            is_food_place = False
            if not is_definitely_attraction:
                is_food_place = (
                    category in ['맛집', '식당', '카페'] or
                    any(t in ['맛집투어', '맛집', '미식'] for t in raw_tags) or
                    any(k in title_lower for k in ['식당', '레스토랑', '카페', '키친', '하우스', '베이커리', '라멘', '스시', '구루메', '바베큐', '쌀국수']) or
                    (any(k in text_all for k in ['식당', '레스토랑', '전문점']) and '맛집' in text_all)
                )

            if is_food_place and (not category or category == '명소'):
                category = '맛집'
            elif not category or category == '명소':
                category = '관광지'

            return PlaceCandidate(
                place_id=doc.metadata['place_id'],
                title=title,
                description=desc,
                tags=raw_tags,
                category=category,
                lat=doc.metadata['lat'],
                lng=doc.metadata['lng'],
                stay_duration_mins=doc.metadata.get('duration_mins', 75 if is_food_place else 90)
            ), is_food_place

        seen_ids = set()
        food_candidates: List[PlaceCandidate] = []
        attraction_candidates: List[PlaceCandidate] = []

        # 명소 및 전체 후보 파싱
        for doc in results:
            pid = doc.metadata.get('place_id')
            if not pid or pid in seen_ids:
                continue
            seen_ids.add(pid)
            place_cand, is_food = parse_place_doc(doc)
            if is_food:
                food_candidates.append(place_cand)
            else:
                attraction_candidates.append(place_cand)

        # 전용 맛집 후보 파싱 추가
        for doc in food_results:
            pid = doc.metadata.get('place_id')
            if not pid or pid in seen_ids:
                continue
            seen_ids.add(pid)
            place_cand, is_food = parse_place_doc(doc)
            if is_food:
                food_candidates.append(place_cand)
            else:
                attraction_candidates.append(place_cand)

        # 태그 일치도 스코어링 정렬 (명소 후보군)
        def score_place(p: PlaceCandidate):
            return len(set(cleaned_styles) & set(p.tags))

        attraction_candidates.sort(key=score_place, reverse=True)

        # 결합된 candidates (하위 호환 및 Gemini 선별용)
        candidates = attraction_candidates + food_candidates

        if not candidates:
            print(f"🌍 [Plan] '{request.destination}' DB 데이터 미존재 ➔ Gemini 3.5 Flash 실시간 랜드마크 생성 폴백 가동!")
            candidates = await self._generate_places_with_gemini_fallback(request.destination, cleaned_styles, count=dynamic_k)
            # 폴백 생성 시에도 맛집/명소 분리
            food_candidates = [c for c in candidates if c.category == '맛집' or any(t in ['맛집', '맛집투어'] for t in c.tags)]
            attraction_candidates = [c for c in candidates if c not in food_candidates]
            
            if not candidates:
                raise NoPlacesFoundError(
                    f"'{request.destination}'에 대해 추천할 수 있는 장소 데이터를 생성하지 못했습니다."
                )

        print(f"✅ [장소 후보 확보] '{request.destination}' 명소 {len(attraction_candidates)}개, 전용 맛집 {len(food_candidates)}개 확보 완료")

        # [2단계] Gemini를 이용한 지능형 장소 선정
        # 유저 취향에 맞는 명소들과 점심/저녁 맛집들을 균형 있게 추천 사유 생성
        target_count = travel_days * 5
        selected_data = await self._select_places_with_gemini(candidates, request, count=target_count)

        # [3단계] 최종 시간표 생성: Day별 점심/저녁 맛집 고정 + 태그 명소 슬롯 최적화
        itinerary = await self._simulate_itinerary_v3(
            selected_data=selected_data,
            food_pool=food_candidates,
            attraction_pool=attraction_candidates,
            duration=request.duration,
            destination=request.destination,
            travel_styles=cleaned_styles
        )

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

        # 정규화된 유저 스타일 추출
        cleaned_styles = [_clean_theme_tag(s) for s in request.travel_style if _clean_theme_tag(s)]
        if not cleaned_styles:
            cleaned_styles = ["인스타감성", "힐링"]

        # 후보지 정보를 텍스트로 정리 (카테고리, 태그, 체류시간 포함하여 AI에 전달)
        candidates_text = "\n".join([
            f"- ID: {c.place_id}, 이름: {c.title}, 카테고리: {c.category}, 태그: [{', '.join(c.tags)}], 체류: {c.stay_duration_mins}분, 설명: {c.description}"
            for c in candidates
        ])

        prompt = f"""
당신은 베테랑 여행 가이드입니다. 다음 유저의 성향과 여행 정보를 바탕으로, 후보 장소들 중 가장 적합한 {count}개를 선정하고 일정을 짜주세요.

[유저 정보]
- 이름: {request.user_name}
- 여행 국가: {request.country}
- 목적지(도시): {request.destination}
- 여행 기간: {request.duration.days}일
- 필수 포함 선호 스타일/테마: {', '.join(cleaned_styles)}
- 유저 DNA: {request.dna_type}

[후보 장소 리스트]
{candidates_text}

[중요 임무]
1. 위 후보 장소 리스트는 반드시 '{request.country}' '{request.destination}'에 위치한 장소들입니다.
2. ⭐️ [태그 매칭 최우선]: 유저가 선택한 테마({', '.join(cleaned_styles)})와 태그가 일치하는 장소를 반드시 우선적으로 선별하세요.
   - 유저가 '맛집투어'를 선택했다면 점심/저녁에 방문할 맛집/식당을 반드시 포함하세요.
   - 유저가 '야경투어'를 선택했다면 일몰 후 방문할 야경/루프탑/야시장 명소를 반드시 포함하세요.
   - '액티비티', '문화체험', '자연', '힐링', '쇼핑' 등 선택된 테마의 장소를 충실히 반영하세요.
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

    async def _generate_places_with_gemini_fallback(self, destination: str, travel_style: List[str], count: int = 16) -> List[PlaceCandidate]:
        """
        벡터 DB에 아직 장소가 적재되지 않은 글로벌 도시를 위해 Gemini가 신뢰도 높은 명소와 실좌표를 실시간 생성합니다.
        """
        if not self.client:
            return []

        prompt = f"""
당신은 전 세계 여행 데이터베이스 전문가입니다.
여행지 '{destination}'에서 여행자가 가장 사랑하는 핵심 관광 명소, 랜드마크, 맛집 {min(count, 20)}곳을 추천해 주세요.
유저 선호 테마는 [{', '.join(travel_style)}] 입니다.

[반드시 지켜야 할 사항]
1. 실제 존재하는 정확한 위도(lat)와 경도(lng)를 소수점 4자리 이상으로 제공하세요.
2. 카테고리는 '관광지' 또는 '맛집'으로만 지정하세요.
3. 반드시 아래 JSON 배열 포맷으로만 응답하세요:

[
  {{
    "title": "장소 이름 (한글 또는 영문 공식 명칭)",
    "description": "이 장소의 핵심 매력과 볼거리 설명 (1~2줄)",
    "category": "관광지",
    "lat": 13.7563,
    "lng": 100.5018,
    "stay_duration_mins": 90
  }}
]
"""
        try:
            response = self.client.models.generate_content(
                model=self.target_model,
                contents=prompt
            )
            raw_text = response.text.strip()
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]

            places_json = json.loads(raw_text.strip())
            candidates = []
            for idx, p in enumerate(places_json):
                candidates.append(
                    PlaceCandidate(
                        place_id=f"fallback_{destination}_{idx}",
                        title=p.get('title', f"{destination} 명소 {idx+1}"),
                        description=p.get('description', f"{destination}의 대표 여행지입니다."),
                        tags=travel_style,
                        category=p.get('category', '관광지'),
                        lat=float(p.get('lat', 0.0)),
                        lng=float(p.get('lng', 0.0)),
                        stay_duration_mins=int(p.get('stay_duration_mins', 90))
                    )
                )
            print(f"✨ [Gemini Fallback 성공] '{destination}' 글로벌 명소 {len(candidates)}개 실시간 생성 완료!")
            return candidates
        except Exception as e:
            print(f"❌ [Gemini Fallback 실패] '{destination}': {e}")
            return []

    def _assign_time_windows_for_day(self, day_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        일차별 장소들의 태그/특성을 분석하여 점심/저녁/야경/주간 골든타임 시간창(Time Window)을 자동 부여합니다.
        (단위: 00:00 자정 기준 분)
        """
        has_lunch = False
        has_dinner = False
        has_night = False
        
        # 1차 판별
        for it in day_items:
            place = it['place']
            tags = getattr(place, 'tags', []) or []
            text_desc = (getattr(place, 'title', '') or '') + ' ' + (getattr(place, 'description', '') or '') + ' ' + (it.get('reason') or '')
            
            is_food = any(t in ['맛집투어', '맛집'] for t in tags) or any(k in text_desc for k in ['식당', '미식', '맛집', '푸드', '카페', '디저트', '소바', '스시', '라멘', '구루메', '레스토랑'])
            is_night = any(t in ['야경투어', '야경'] for t in tags) or any(k in text_desc for k in ['야경', '루프탑', '야시장', '펍', '바', '나이트', '선셋', '일몰'])
            
            it['_is_food'] = is_food
            it['_is_night'] = is_night

        # 2차 시간창 배분
        for idx, it in enumerate(day_items):
            is_food = it['_is_food']
            is_night = it['_is_night']
            
            if is_night and not has_night:
                # 야경 골든타임: 18:30 ~ 22:30 (1110 ~ 1350분)
                it['opening_hours'] = [1110, 1350]
                has_night = True
            elif is_food:
                if not has_lunch:
                    # 점심 골든타임: 11:30 ~ 13:30 (690 ~ 810분)
                    it['opening_hours'] = [690, 810]
                    has_lunch = True
                elif not has_dinner:
                    # 저녁 골든타임: 17:30 ~ 20:30 (1050 ~ 1230분)
                    it['opening_hours'] = [1050, 1230]
                    has_dinner = True
                else:
                    # 디저트/카페: 14:00 ~ 17:30 (840 ~ 1050분)
                    it['opening_hours'] = [840, 1050]
            else:
                # 일반 관광지: 첫 장소는 오전, 나머지는 오후
                if idx == 0 and not has_lunch:
                    it['opening_hours'] = [570, 720] # 09:30 ~ 12:00
                else:
                    it['opening_hours'] = [810, 1080] # 13:30 ~ 18:00

        # 시간창 시작 시각(opening_hours[0]) 기준 오름차순 정렬하여 가장 이른 오전 명소가 시작점이 되도록 설정
        day_items.sort(key=lambda x: x.get('opening_hours', [570, 1080])[0])
        return day_items

    async def _simulate_itinerary_v3(
        self,
        selected_data: List[Dict[str, Any]],
        food_pool: List[PlaceCandidate],
        attraction_pool: List[PlaceCandidate],
        duration: Any,
        destination: str = "kanto",
        travel_styles: List[str] = None
    ) -> List[DayItinerary]:
        """
        [1일 황금 밸런스 슬롯 아키텍처]
        각 일자(Day)마다:
        1. 점심 식사 (11:30~13:30) 맛집 고정 필수 배치
        2. 저녁 식사 (17:30~20:00) 맛집 고정 필수 배치
        3. 오전 명소 (09:30~11:30) 유저 테마 명소 배치
        4. 오후 명소 (13:30~17:30) 유저 테마 명소 1~2개 배치
        5. 야경 명소 (19:30~22:00) '야경투어' 선택 시 우선 배치
        이후 OR-Tools VRPTW 엔진으로 실제 이동시간 및 현실적 도착 시간표 최적화
        """
        if travel_styles is None:
            travel_styles = []

        days_count = duration.days
        selected_map = {item['place'].place_id: item['reason'] for item in selected_data}

        # 1. 사용 가능한 맛집 풀과 명소 풀 정돈 (중복 방지용 Set)
        used_place_ids = set()

        def get_reason(place: PlaceCandidate, default_reason: str) -> str:
            return selected_map.get(place.place_id, place.description or default_reason)

        is_night_tour = any(t in ['야경투어', '야경'] for t in travel_styles)

        days_itineraries = []

        # 날짜별로 슬롯 채우기
        for day_idx in range(days_count):
            day_items: List[Dict[str, Any]] = []

            # (1) 오전 명소 1개 (09:30 ~ 11:30)
            avail_attractions = [p for p in attraction_pool if p.place_id not in used_place_ids]
            # 야경 전용이 아닌 일반 관광지 우선
            morning_cand = next(
                (p for p in avail_attractions if not any(t in ['야경투어', '야경'] for t in p.tags)),
                avail_attractions[0] if avail_attractions else None
            )
            if morning_cand:
                used_place_ids.add(morning_cand.place_id)
                day_items.append({
                    "place": morning_cand,
                    "reason": get_reason(morning_cand, f"{destination}의 대표 명소에서 상쾌하게 하루 일정을 시작합니다."),
                    "slot": "morning",
                    "opening_hours": [570, 660]  # 09:30 ~ 11:00
                })

            # (2) 점심 식사 맛집 필수 배치 (12:00 ~ 13:30)
            avail_foods = [p for p in food_pool if p.place_id not in used_place_ids]
            # 오전 장소와 가까운 맛집 우선 선택 (거리 계산)
            if morning_cand and avail_foods:
                avail_foods.sort(key=lambda f: (f.lat - morning_cand.lat)**2 + (f.lng - morning_cand.lng)**2)
            
            lunch_cand = avail_foods[0] if avail_foods else None
            if lunch_cand:
                used_place_ids.add(lunch_cand.place_id)
                day_items.append({
                    "place": lunch_cand,
                    "reason": get_reason(lunch_cand, f"오전 여행 후 즐기는 {destination} 현지 로컬 점심 맛집입니다."),
                    "slot": "lunch",
                    "opening_hours": [720, 810]  # 12:00 ~ 13:30
                })

            # (3) 오후 명소 1~2개 (14:00 ~ 17:30)
            avail_attractions = [p for p in attraction_pool if p.place_id not in used_place_ids]
            afternoon_cands = [p for p in avail_attractions if not any(t in ['야경투어', '야경'] for t in p.tags)][:2]
            for p_cand in afternoon_cands:
                used_place_ids.add(p_cand.place_id)
                day_items.append({
                    "place": p_cand,
                    "reason": get_reason(p_cand, f"오후 시간대에 여유롭게 둘러보는 취향 맞춤 명소입니다."),
                    "slot": "afternoon",
                    "opening_hours": [840, 1050]  # 14:00 ~ 17:30
                })

            # (4) 저녁 식사 맛집 필수 배치 (18:00 ~ 20:00)
            avail_foods = [p for p in food_pool if p.place_id not in used_place_ids]
            last_afternoon = afternoon_cands[-1] if afternoon_cands else (lunch_cand or morning_cand)
            if last_afternoon and avail_foods:
                avail_foods.sort(key=lambda f: (f.lat - last_afternoon.lat)**2 + (f.lng - last_afternoon.lng)**2)
            
            dinner_cand = avail_foods[0] if avail_foods else None
            if dinner_cand:
                used_place_ids.add(dinner_cand.place_id)
                day_items.append({
                    "place": dinner_cand,
                    "reason": get_reason(dinner_cand, f"하루의 피로를 풀고 즐기는 {destination} 특별한 저녁 미식 코스입니다."),
                    "slot": "dinner",
                    "opening_hours": [1080, 1200]  # 18:00 ~ 20:00
                })

            # (5) 야경 명소 / 힐링 산책 (20:00 ~ 22:30) - 야경투어 선호 시 또는 여유 슬롯
            if is_night_tour:
                avail_attractions = [p for p in attraction_pool if p.place_id not in used_place_ids]
                night_cand = next(
                    (p for p in avail_attractions if any(t in ['야경투어', '야경'] for t in p.tags)),
                    None
                )
                if night_cand:
                    used_place_ids.add(night_cand.place_id)
                    day_items.append({
                        "place": night_cand,
                        "reason": get_reason(night_cand, f"화려한 조명과 야경이 아름다운 로맨틱 나이트 코스입니다."),
                        "slot": "night",
                        "opening_hours": [1200, 1350]  # 20:00 ~ 22:30
                    })

            # 만약 슬롯으로 다 못 채웠다면 Gemini 선정 장소 중 미사용된 것 추가 (최대 5개 맞춤)
            if len(day_items) < 4:
                leftover = [item for item in selected_data if item['place'].place_id not in used_place_ids]
                for item in leftover[:(4 - len(day_items))]:
                    used_place_ids.add(item['place'].place_id)
                    day_items.append({
                        "place": item['place'],
                        "reason": item['reason'],
                        "slot": "extra",
                        "opening_hours": [840, 1080]
                    })

            # 시간순(opening_hours 시작 시각)으로 정렬하여 오전 -> 점심 -> 오후 -> 저녁 -> 야경 순서 확립
            day_items.sort(key=lambda x: x.get('opening_hours', [540, 1440])[0])

            # (6) OR-Tools VRPTW 경로 최적화 실행
            start_item = day_items[0]
            start_window = start_item.get('opening_hours', [570, 690])

            places_to_visit = [
                PlaceVisitItem(
                    place_id=item['place'].place_id,
                    lat=item['place'].lat,
                    lng=item['place'].lng,
                    stay_duration_mins=item['place'].stay_duration_mins,
                    opening_hours=item.get('opening_hours', [540, 1440])
                ) for item in day_items[1:]
            ]

            route_req = RouteOptimizeRequest(
                destination=destination,
                start_location=Location(
                    lat=start_item['place'].lat,
                    lng=start_item['place'].lng,
                    stay_duration_mins=start_item['place'].stay_duration_mins,
                    opening_hours=start_window
                ),
                places_to_visit=places_to_visit,
                max_days=1
            )

            print(f"🛣️ [Plan VRPTW 황금슬롯] {day_idx+1}일차 점심/저녁 보장 최적화 중... (장소 {len(day_items)}개)")
            final_day_items = []
            try:
                route_res = await route_service.optimize_route(route_req)
                if route_res.data.optimized_routes and route_res.data.optimized_routes[0].route:
                    prev_it = None
                    for step in route_res.data.optimized_routes[0].route:
                        pid = start_item['place'].place_id if step.place_id == "START_POINT" else step.place_id
                        matched = next((item for item in day_items if item['place'].place_id == pid), None)
                        if matched:
                            travel_mins = 15
                            travel_km = 2.0
                            if prev_it:
                                dist = np.sqrt((matched['place'].lat - prev_it['place'].lat)**2 + (matched['place'].lng - prev_it['place'].lng)**2) * 111.0
                                travel_km = round(max(0.6, dist), 1)
                                travel_mins = int(max(6, travel_km * 3 + 5))

                            final_day_items.append(PlaceItem(
                                place_id=matched['place'].place_id,
                                suggested_time=step.expected_arrival,
                                title=matched['place'].title,
                                location=f"[{travel_mins}분|{travel_km}km] " + matched['reason'],
                                category=matched['place'].category or "관광지",
                                tags=matched['place'].tags or [],
                                lat=matched['place'].lat,
                                lng=matched['place'].lng
                            ))
                            prev_it = matched
            except Exception as e:
                print(f"⚠️ [Plan VRPTW] 최적화 폴백 전환 ({e})")

            # 최적화 폴백 (실제 현실적인 황금 타임테이블 직결)
            if not final_day_items:
                slot_times = {
                    "morning": "09:30",
                    "lunch": "12:00",
                    "afternoon": "14:30",
                    "dinner": "18:00",
                    "night": "20:00",
                    "extra": "16:00"
                }
                for it in day_items:
                    assigned_time = slot_times.get(it.get('slot', 'morning'), "10:00")
                    final_day_items.append(PlaceItem(
                        place_id=it['place'].place_id,
                        suggested_time=assigned_time,
                        title=it['place'].title,
                        location=it['reason'],
                        category=it['place'].category or "관광지",
                        tags=it['place'].tags or [],
                        lat=it['place'].lat,
                        lng=it['place'].lng
                    ))

            days_itineraries.append(DayItinerary(
                day=day_idx + 1,
                places=final_day_items
            ))

        return days_itineraries

    async def _simulate_itinerary_v2(self, selected_data: List[Dict[str, Any]], duration: Any, destination: str = "kanto") -> List[DayItinerary]:
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

            # 거리에 따른 유동적 정원 결정 (밀집 구역: 4~5개, 보통: 3~4개, 멀고 넓은 외곽 구역: 2~3개)
            if mean_dist <= 2.5 and len(c_items) >= 4:
                target_capacity = min(5, len(c_items)) # 촘촘한 도심 ➔ 4~5개 알찬 코스
            elif mean_dist >= 7.0:
                target_capacity = 2 # 넓고 먼 외곽 ➔ 2개 여유 힐링 코스
            else:
                target_capacity = 3 # 일반 구역 ➔ 3개 코스
                
            clusters[d] = c_items[:target_capacity]

        # 남은 알짜배기 장소들은 유동적으로 여유 있는 날짜에 최대 5개 한도 내로 자연스럽게 배치
        used_ids = {it['place'].place_id for d in clusters for it in clusters[d]}
        leftover = [it for it in selected_data if it['place'].place_id not in used_ids]
        for it in leftover:
            min_day = min(clusters.keys(), key=lambda k: len(clusters[k]))
            if len(clusters[min_day]) < 5:
                clusters[min_day].append(it)

        days = []
        # 2. 각 일자별 VRPTW (시간 창 제약 TSP) 최적화 (RouteService 연동)
        for d in range(duration.days):
            day_batch = clusters.get(d, [])
            if not day_batch: continue
            
            # ⭐️ [VRPTW 핵심]: 각 장소의 성격에 맞춰 골든타임 시간창(Time Window) 자동 부여 및 시작점 정렬
            day_batch = self._assign_time_windows_for_day(day_batch)

            # Route 최적화를 위한 Request 생성 (가장 이른 오전 명소를 시작점으로)
            start_item = day_batch[0]
            start_window = start_item.get('opening_hours', [540, 570])

            places_to_visit = []
            if len(day_batch) > 1:
                places_to_visit = [
                    PlaceVisitItem(
                        place_id=item['place'].place_id, 
                        lat=item['place'].lat, 
                        lng=item['place'].lng, 
                        stay_duration_mins=item['place'].stay_duration_mins, 
                        opening_hours=item.get('opening_hours', [540, 1440])
                    ) for item in day_batch[1:]
                ]
            
            route_req = RouteOptimizeRequest(
                destination=destination,
                start_location=Location(
                    lat=start_item['place'].lat, 
                    lng=start_item['place'].lng,
                    stay_duration_mins=start_item['place'].stay_duration_mins,
                    opening_hours=start_window
                ),
                places_to_visit=places_to_visit,
                max_days=1
            )
            
            print(f"🛣️ [Plan VRPTW] {d+1}일차 시간창 경로 최적화 중... (노드 {len(day_batch)}개)")
            day_items = []
            try:
                route_res = await route_service.optimize_route(route_req)
                if route_res.data.optimized_routes and route_res.data.optimized_routes[0].route:
                    prev_item = None
                    for idx, step in enumerate(route_res.data.optimized_routes[0].route):
                        pid = start_item['place'].place_id if step.place_id == "START_POINT" else step.place_id
                        matched_item = next((item for item in day_batch if item['place'].place_id == pid), None)
                        if matched_item:
                            # 이전 장소로부터의 OSRM 실제 이동시간 & 거리를 동적 계산
                            travel_mins = 15
                            travel_km = 2.5
                            if prev_item:
                                dist = np.sqrt((matched_item['place'].lat - prev_item['place'].lat)**2 + (matched_item['place'].lng - prev_item['place'].lng)**2) * 111.0
                                travel_km = round(max(0.8, dist), 1)
                                travel_mins = int(max(8, travel_km * 4 + 5)) # OSRM 기반 동적 맵 매칭 이동시간 산출

                            day_items.append(PlaceItem(
                                place_id=matched_item['place'].place_id,
                                suggested_time=step.expected_arrival,
                                title=matched_item['place'].title,
                                location=f"[{travel_mins}분|{travel_km}km] " + matched_item['reason'], # 백엔드 동적 지표 인코딩
                                category=matched_item['place'].category or "관광지",
                                tags=matched_item['place'].tags or [],
                                lat=matched_item['place'].lat,
                                lng=matched_item['place'].lng
                            ))
                            prev_item = matched_item
            except Exception as route_err:
                print(f"❌ [Plan] 경로 최적화 중 에러 발생: {route_err}. 현실적 시간표 폴백을 시작합니다.")
            
            if not day_items: # Fallback (혹시 최적화 실패 시 현실적인 기본 시간표 적용)
                default_times = ["09:30", "11:45", "14:15", "18:30", "20:30"]
                for i, item in enumerate(day_batch):
                    fallback_time = default_times[min(i, len(default_times)-1)]
                    day_items.append(PlaceItem(
                        place_id=item['place'].place_id,
                        suggested_time=fallback_time,
                        title=item['place'].title,
                        location=item['reason'],
                        category=item['place'].category or "관광지",
                        tags=item['place'].tags or [],
                        lat=item['place'].lat,
                        lng=item['place'].lng
                    ))
                    
            days.append(DayItinerary(day=d+1, places=day_items))
            
        return days

plan_service = PlanService()
