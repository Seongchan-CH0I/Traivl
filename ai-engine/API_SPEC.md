# 🤖 AI Engine API 인터페이스 명세서 (초안)

본 문서는 프론트엔드 및 백엔드 팀과 AI 엔진이 주고받을 **API 데이터 포맷(인터페이스)**을 사전에 협의하기 위해 작성된 임시 초안입니다.
각 API의 세부 사항(필드명, 타입 등)은 팀 논의를 거쳐 수정될 수 있으며, 최종 확정 후 FastAPI Swagger UI(`http://ai-server:8000/docs`)를 통해 공식 명세서로 자동 제공될 예정입니다.

---

## 🌎 기본 정보 (Base Information)
*   **Base URL:** `http://ai-server:8000/api/v1` (로컬 도커 환경 기준)
*   **Content-Type:** `application/json` (파일 업로드 제외)

---

## 1. 💬 여행 계획 추천 (Chat & LLM)
유저의 여행 취향, 기간, 목적지를 입력받아 최적의 여행지 목록과 AI의 추천 코멘트를 생성합니다.

### POST `/chat/recommend`

#### 📥 Request (백엔드 ➡️ AI)
```json
{
  "user_id": 12345,
  "destination": "제주도",
  "duration": {
    "days": 3,
    "nights": 2
  },
  "travel_style": ["힐링", "맛집탐방", "오션뷰"],
  "companion": "가족"
}
```

#### 📤 Response (AI ➡️ 백엔드)
```json
{
  "status": "success",
  "data": {
    "title": "가족과 함께하는 2박 3일 힐링 제주 여행",
    "summary": "어르신들도 편하게 다닐 수 있는 동선으로 맛집과 힐링 스팟을 엮었습니다.",
    "recommended_places": [
      { "place_id": "p001", "name": "함덕 해수욕장", "category": "관광지" },
      { "place_id": "p002", "name": "올래국수", "category": "식당" }
    ]
  }
}
```

---

## 2. 🗺️ 여행 경로 최적화 (Route & TSP)
사용자가 선택한 여행 장소들의 목록과 시작점(숙소/공항)을 받아, 이동 시간과 동선이 가장 효율적인 일차별 경로로 정렬하여 반환합니다.

### POST `/route/optimize`

#### 📥 Request
```json
{
  "start_location": { "lat": 33.5097, "lng": 126.5219 },
  "places_to_visit": [
    { "place_id": "p001", "lat": 33.5431, "lng": 126.6698, "stay_duration_mins": 90 },
    { "place_id": "p002", "lat": 33.4890, "lng": 126.4983, "stay_duration_mins": 60 }
  ],
  "max_days": 3
}
```

#### 📤 Response
```json
{
  "status": "success",
  "data": {
    "optimized_routes": [
      {
        "day": 1,
        "total_travel_time_mins": 120,
        "route": [
          { "step": 1, "place_id": "START_POINT", "expected_arrival": "09:00" },
          { "step": 2, "place_id": "p002", "expected_arrival": "09:30" },
          { "step": 3, "place_id": "p001", "expected_arrival": "13:00" }
        ]
      }
    ]
  }
}
```

---

## 3. 📸 사진 텍스트 및 정보 추출 (Vision & OCR)
여행지 영수증, 안내판, 랜드마크 사진 등 이미지 파일을 업로드받아 텍스트 또는 장소 정보를 추출합니다.

### POST `/vision/analyze`

#### 📥 Request (Multipart/form-data)
*   **file:** (이미지 파일 - image/jpeg, image/png 등)
*   **type:** `"receipt"` | `"landmark"` (분석 목적 명시)

#### 📤 Response
```json
{
  "status": "success",
  "data": {
    "extracted_text": "제주흑돼지 1인분 18,000원",
    "predicted_category": "식당",
    "keywords": ["제주흑돼지", "고기"]
  }
}
```

---

## 4. 🎙️ 음성 인식 (Voice & STT)
유저가 녹음한 여행 기록이나 일기 오디오 파일을 텍스트 스크립트로 변환하여 반환합니다.

### POST `/voice/transcribe`

#### 📥 Request (Multipart/form-data)
*   **audio_file:** (음성 파일 - audio/m4a, audio/mp3 등)

#### 📤 Response
```json
{
  "status": "success",
  "data": {
    "text": "오늘 함덕 해수욕장에서 수영했는데 정말 재미있었어.",
    "language_detected": "ko",
    "duration_sec": 5.4
  }
}
```

---

### 📝 팀 회의 시 조율(논의)이 필요한 사항 체크리스트
- [ ] **장소 ID(place_id) 구조 통일:** AI가 특정 장소를 지칭할 때(예: 올래국수), 백엔드의 관광지/식당 DB Primary Key 구조를 그대로 사용할지 여부
- [ ] **위경도(lat/lng) 제공 주체:** `/route/optimize` 요청 시, 각 장소의 위경도 좌표를 백엔드가 모두 담아서 넘겨줄 것인지, AI 서버가 장소 이름(또는 ID)만으로 직접 외부 지도 API에서 조회해 올 것인지 논의
- [ ] **에러 반환 규격 (Error Handling):** 예외 상황(예: 이미지 포맷 에러, AI 서버 지연 등) 발생 시 프론트/백엔드에 반환할 통일된 에러 응답 포맷(JSON) 규정
