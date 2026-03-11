# 🤖 AI Engine API 인터페이스 명세서 (초안)

본 문서는 프론트엔드 및 백엔드 팀과 AI 엔진이 주고받을 "API 데이터 포맷(인터페이스)" 을 사전에 협의하기 위해 작성된 임시 초안입니다.
각 API의 세부 사항(필드명, 타입 등)은 팀 논의를 거쳐 수정될 수 있으며, 최종 확정 후 FastAPI Swagger UI(`http://ai-server:8000/docs`)를 통해 공식 명세서로 자동 제공될 예정입니다.

---

## 🌎 기본 정보 (Base Information)
*   **Base URL:** `http://ai-server:8000/api/v1` (로컬 도커 환경 기준)
*   **Content-Type:** `application/json`

---

## 1. 💬 여행 계획 추천 및 가이드 (`/chat/recommend`)
유저의 여행 취향, 기간, 목적지를 입력받아 최적의 여행지 목록과 추천 코멘트를 생성합니다.

**[POST] `/chat/recommend`**

*   **요청 (Request) - 백엔드 ➡️ AI**
```json
{
  "user_id": 12345,
  "destination": "오사카, 일본",
  "duration": {
    "days": 3,
    "nights": 2
  },
  "travel_style": ["역사", "맛집탐방"],
  "companion": "부모님"
}
```

*   **응답 (Response) - AI ➡️ 백엔드**
```json
{
  "status": "success",
  "data": {
    "title": "부모님과 함께하는 3박 4일 오사카 역사 & 미식 여행",
    "summary": "어르신들도 편하게 다닐 수 있는 동선으로 구성했으며, 현지 식사 매너와 간단한 일본어 회화 팁을 포함했습니다.",
    "cultural_tips": [
      "식당에서 종업원을 부를 때 큰 소리로 '스미마센'이라고 하시면 됩니다.",
      "대중교통 이용 시 휴대전화 통화는 자제하는 것이 매너입니다."
    ],
    "recommended_places": [
      { 
        "place_id": "p001", 
        "name": "오사카 성", 
        "category": "관광지",
        "local_name": "大阪城",
        "context": "16세기에 지어진 일본의 3대 명성 중 하나로, 역사적인 의미가 깊은 랜드마크입니다."
      }
    ]
  }
}
```

---

## 2. 🗺️ 여행 경로 최적화 (Route & TSP)
사용자가 선택한 여행 장소들의 목록과 시작점(숙소/공항)을 받아, 이동 시간과 동선이 가장 효율적인 일차별 경로로 정렬하여 반환합니다.

### POST `/route/optimize`

*   **요청 (Request)**
```json
{
  "start_location": { "lat": 34.6937, "lng": 135.5023 },
  "places_to_visit": [
    { "place_id": "p001", "lat": 34.6873, "lng": 135.5262, "stay_duration_mins": 90 }
  ],
  "max_days": 3
}
```

*   **응답 (Response)**
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
          { "step": 2, "place_id": "p001", "expected_arrival": "09:30" }
        ]
      }
    ]
  }
}
```

---

## 3. 📸 실시간 스마트 렌즈 (Vision & OCR & Culture)
유저가 프론트엔드(앱/웹)에서 카메라 버튼을 눌러 피사체(안내문, 간판, 메뉴판, 랜드마크 등)를 비추었을 때, 기기에서 추출한 텍스트 또는 가벼운 이미지를 전송받아 번역 및 상황에 맞는 문화 정보/에티켓을 실시간으로 해설합니다.

### POST `/vision/lens`

*   **요청 (Request)**
```json
{
  "user_location": "도쿄, 일본",
  "extracted_text": "特製 豚骨ラーメン", // 기기 자체 카메라/OCR로 돌려 추출한 텍스트 (옵션)
  "image_base64": "iVBORw0K...",       // 텍스트가 없는 풍경/사물일 경우 대비한 짧은 압축 이미지 데이터 (옵션)
  "mode": "auto"                       // "text_only", "image_only", "auto" 등
}
```

*   **응답 (Response) - 텍스트 등 인식 객체가 있는 경우 (번역 + 설명)**
```json
{
  "status": "success",
  "data": {
    "identified_type": "식당 메뉴",
    "translated_text": "특제 돈코츠 라멘",
    "explanation": "돼지 뼈를 진하게 우려낸 뽀얀 국물의 전통 라면입니다.",
    "cultural_context": "일본 라면집에서는 국물을 마실 때 그릇째 들고 마시는 것이 자연스러운 문화입니다."
  }
}
```

*   **응답 (Response) - 주변 풍경/랜드마크 (설명만 전달)**
```json
{
  "status": "success",
  "data": {
    "identified_type": "랜드마크",
    "identified_object": "기요미즈데라 (청수사)",
    "explanation": "교토 동쪽에 위치한 역사적인 사찰로, 못을 하나도 쓰지 않고 지은 본당 무대가 유명합니다.",
    "cultural_context": "봄에는 벚꽃, 가을에는 단풍 야간 라이트업이 열려 현지인들도 많이 찾는 대표적인 명소입니다."
  }
}
```

---

## 4. 🎙️ 실시간 통역기반 에티켓 해설 (Voice & Culture)
유저가 마이크 버튼을 누르고 현지인의 말을 듣거나 본인이 말할 때, 언어 통역과 동시에 숨겨진 현지 문화의 의미나 대답 팁을 알려줍니다.

### POST `/voice/interpreter`

*   **요청 (Request)**
```json
{
  "user_location": "방콕, 태국",
  "source_text": "ขอบคุณครับ (코쿤캅)", // 기기에서 Web Speech API 등으로 1차 텍스트 변환하여 전송 (권장)
  "audio_base64": null                 // 텍스트 변환이 어려운 경우를 대비한 짧은 오디오 스트림 (옵션)
}
```

*   **응답 (Response)**
```json
{
  "status": "success",
  "data": {
    "translated_text": "감사합니다",
    "intent_analysis": "상대방이 호의와 고마움을 표시하는 인사말입니다.",
    "cultural_context": "남성의 경우 끝에 '캅', 여성의 경우 '카'를 붙여 성별에 따른 정중함을 구분하는 태국만의 문화가 있습니다.",
    "suggested_reply_ko": "저도 감사합니다. (마이 뻰 라이 캅/카)",
    "suggested_reply_audio_url": "https://ai-server/.../voice_gen_123.mp3" // 프론트에서 재생 버튼(🔈) 클릭 시 들려줄 원어민 발음 링크
  }
}
```

---

## 5. 💬 실시간 모바일 스마트 가이드 (Chat & Assistant)
(1번 항목의 정적인 여행 계획 추천과는 구별되는) 여행 중 실시간으로 발생한 상황이나 궁금증을 채팅으로 물어볼 때, 현지 언어/문화와 맥락에 맞는 답변 및 액션 버튼 가이드를 제공합니다.

### POST `/assistant/ask`

*   **요청 (Request)**
```json
{
  "user_id": 12345,
  "current_location": "방콕 왕궁, 태국",
  "message": "여기 왕궁 들어가고 싶은데, 나 반바지 입고 있어. 들어갈 수 있을까?",
  "chat_history_id": "session_9988"
}
```

*   **응답 (Response)**
```json
{
  "status": "success",
  "data": {
    "reply_message": "현재 복장으로는 입장이 어려워요! 태국 왕궁은 예절을 중시해서 반바지나 민소매 차림으로는 들어갈 수 없습니다. 근처 상점이나 대여소에서 긴 치마나 바지를 빌려 입으셔야 합니다.",
    "cultural_tips": [
      "태국의 사원이나 왕궁 입장 시 어깨와 무릎이 가려지는 단정한 복장은 필수적인 문화적 예의입니다."
    ],
    "suggested_actions": ["근처 옷 대여소 추천받기", "복장 제한이 없는 인근 다른 명소 추천받기"]
  }
}
```

---

### 📝 팀 회의 시 조율(논의)이 필요한 사항 체크리스트
- [ ] **비전/음성 프론트엔드 전처리 범위:** 카메라/마이크에서 얻은 데이터를 기기(Native/Web)단에서 먼저 텍스트(OCR/STT)로 변환해서 줄 것인지, Base64 바이너리로 쏴서 AI 엔진이 변환까지 담당할지 합의
- [ ] **장소 ID(place_id) 구조 통일:** AI가 특정 장소를 지칭할 때(예: 오사카 성), 백엔드의 관광지/식당 DB Primary Key 구조를 그대로 사용할지 여부
- [ ] **에러 반환 규격 (Error Handling):** 예외 상황 발생 시 프론트/백엔드에 반환할 통일된 응답 포맷(JSON) 규정
