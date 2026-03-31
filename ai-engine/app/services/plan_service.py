import os
import json
from typing import List, Dict, Any
from openai import OpenAI
from app.models.plan_model import PlanRequest, PlanResponse, PlanData, DayItinerary, PlaceItem, PlaceCandidate
from app.core.config import settings

class PlanService:
    def __init__(self):
        # OpenAI 클라이언트 초기화
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    async def get_recommended_plan(self, request: PlanRequest) -> PlanResponse:
        """
        사용자 요청에 따라 추천 여행 계획을 생성합니다.
        1단계: 백엔드로부터 받은 후보군 활용 (Data Integration)
        2단계: AI Scoring & Place Selection (OpenAI)
        3단계: Route Simulation (Basic)
        """
        
        # [STEP 1] 백엔드에서 전달받은 후보군 확인
        if not request.candidates:
            # 후보군이 없을 경우 기본 추천 로직 또는 에러 처리
            return PlanResponse(status="error", data=None) # 실제로는 더 구체적인 처리가 필요함

        # [STEP 2] AI Scoring & Place Selection (LLM)
        # 전달받은 후보지들 중 유저 DNA와 목적에 맞는 최고의 장소들을 선정합니다.
        scored_places = await self._select_places_with_ai(
            candidates=request.candidates,
            user_name=request.user_name,
            dna_type=request.dna_type,
            travel_style=request.travel_style,
            destination=request.destination
        )

        # [STEP 3] Route Optimization 및 시뮬레이션 (간이 버전)
        # TODO: 실제 TSP 엔진 연동 필요
        itinerary = self._simulate_itinerary(scored_places, request.duration)

        return PlanResponse(
            status="success",
            data=PlanData(
                course_title=f"{request.user_name}님의 취향을 담은 {request.destination} 여행",
                course_subtitle=f"{request.dna_type} 맞춤형 AI 추천 코스",
                itinerary=itinerary
            )
        )

    async def _select_places_with_ai(self, candidates: List[PlaceCandidate], user_name: str, dna_type: str, travel_style: List[str], destination: str) -> List[Dict[str, Any]]:
        """
        [STEP 2] OpenAI를 사용한 지능형 장소 선정
        """
        # 후보지 정보를 텍스트로 변환
        candidates_text = "\n".join([
            f"- ID: {c.place_id}, 이름: {c.title}, 설명: {c.description}, 태그: {', '.join(c.tags)}"
            for c in candidates
        ])

        prompt = f"""
        당신은 세계 최고의 여행 가이드 AI입니다. 다음 정보를 바탕으로 사용자에게 가장 적합한 여행지 TOP 5를 선정해주세요.

        [사용자 정보]
        - 이름: {user_name}
        - 여행 DNA: {dna_type}
        - 선호 스타일: {', '.join(travel_style)}
        - 목적지: {destination}

        [후보 장소 리스트]
        {candidates_text}

        [요구사항]
        1. 후보지 중 사용자의 성향과 가장 잘 어울리는 장소 5개를 선정하세요.
        2. 선정된 장소들에 대해 사용자의 DNA와 연관된 개인화된 추천 사유를 한글로 작성하세요.
        3. 결과는 반드시 다음과 같은 JSON 형식을 따라야 합니다:
        {{
            "selected": [
                {{
                    "place_id": "ID",
                    "title": "이름",
                    "reason": "개인화된 추천 사유"
                }},
                ...
            ]
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "당신은 맞춤형 여행 코스를 기획하는 전문가입니다."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            selected_info = result.get("selected", [])
            
            # 원본 후보지 데이터와 결합
            final_selection = []
            for item in selected_info:
                original = next((c for c in candidates if c.place_id == item["place_id"]), None)
                if original:
                    final_selection.append({
                        **original.model_dump(),
                        "ai_reason": item["reason"]
                    })
            return final_selection
            
        except Exception as e:
            print(f"AI Scoring Error: {e}")
            # 에러 발생 시 상위 N개 기본 반환
            return [c.model_dump() for c in candidates[:5]]

    def _simulate_itinerary(self, places: List[Dict[str, Any]], duration: Any) -> List[DayItinerary]:
        """
        TSP 엔진 연동 전까지 사용하는 간이 시뮬레이션
        """
        days = []
        places_per_day = (len(places) // duration.days) + 1
        
        for d in range(1, duration.days + 1):
            start_idx = (d-1) * places_per_day
            end_idx = d * places_per_day
            day_places_data = places[start_idx:end_idx]
            
            day_items = [
                PlaceItem(
                    place_id=p["place_id"],
                    suggested_time=f"{10 + i*3}:00", # 임시 시간 배정
                    title=p["title"],
                    location=p.get("ai_reason", "AI 추천 장소") # 추천 사유를 위치 필드 등에 임시 활용
                ) for i, p in enumerate(day_places_data)
            ]
            days.append(DayItinerary(day=d, places=day_items))
        return days

plan_service = PlanService()
