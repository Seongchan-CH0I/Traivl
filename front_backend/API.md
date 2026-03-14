# Traivl API 명세서

> AI기반 아키텍처를 활용한 초개인화 여행 에이전트 시스템

---

## Base URL

```
http://localhost:3000/api/v1
```

---

## 공통

### 인증
- 로그인 필요한 API는 `Authorization: Bearer {token}` 헤더 포함

### 공통 응답 형식
```json
{
  "success": true,
  "data": { },
  "message": "string"
}
```

### 공통 에러 형식
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

---

## 1. Auth (인증)

### POST `/auth/signup`
회원가입

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "string",
  "nickname": "string"
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "nickname": "string"
  }
}
```

**Response 409** - 이메일 중복
```json
{
  "success": false,
  "error": { "code": "EMAIL_EXISTS", "message": "이미 사용 중인 이메일입니다" }
}
```

---

### POST `/auth/login`
로그인

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "string"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "userId": 1
  }
}
```

**Response 401** - 인증 실패
```json
{
  "success": false,
  "error": { "code": "INVALID_CREDENTIALS", "message": "이메일 또는 비밀번호가 올바르지 않습니다" }
}
```

---

## 2. User (사용자)

### GET `/users/me`
내 프로필 조회

**Auth** 필요

**Response 200**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "nickname": "string",
    "profileImage": "string | null",
    "dnaAnalyzed": false
  }
}
```

---

### PUT `/users/me`
프로필 수정

**Auth** 필요

**Request Body**
```json
{
  "nickname": "string",
  "profileImage": "string"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "nickname": "string",
    "profileImage": "string"
  }
}
```

---

## 3. DNA 분석 (취향 파악)

### POST `/dna/survey`
DNA 설문 결과 저장 (4가지 설문)

**Auth** 필요

**Request Body**
```json
{
  "answers": [
    { "questionId": 1, "answer": "자연" },
    { "questionId": 2, "answer": "혼자" },
    { "questionId": 3, "answer": "느긋하게" },
    { "questionId": 4, "answer": "맛집" }
  ]
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "dnaType": "SOLO_NATURE",
    "description": "조용한 자연 속 힐링을 선호하는 여행자",
    "tags": ["자연", "힐링", "혼자여행"]
  }
}
```

---

### GET `/dna/me`
내 DNA 분석 결과 조회

**Auth** 필요

**Response 200**
```json
{
  "success": true,
  "data": {
    "dnaType": "SOLO_NATURE",
    "description": "string",
    "tags": ["string"],
    "analyzedAt": "2025-01-01T00:00:00Z"
  }
}
```

---

## 4. 여행 일정 (Schedule)

### POST `/schedules`
AI 기반 여행 일정 생성

**Auth** 필요

**Request Body**
```json
{
  "destination": "제주도",
  "startDate": "2025-06-01",
  "endDate": "2025-06-03",
  "themes": ["자연", "맛집"]
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "scheduleId": 1,
    "title": "제주도 2박 3일",
    "destination": "제주도",
    "startDate": "2025-06-01",
    "endDate": "2025-06-03",
    "days": [
      {
        "day": 1,
        "date": "2025-06-01",
        "places": [
          {
            "order": 1,
            "name": "성산일출봉",
            "category": "관광",
            "address": "string",
            "lat": 33.458,
            "lng": 126.942,
            "estimatedTime": "09:00"
          }
        ]
      }
    ]
  }
}
```

---

### GET `/schedules`
내 여행 일정 목록 조회

**Auth** 필요

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "scheduleId": 1,
      "title": "제주도 2박 3일",
      "destination": "제주도",
      "startDate": "2025-06-01",
      "endDate": "2025-06-03",
      "thumbnailUrl": "string | null"
    }
  ]
}
```

---

### GET `/schedules/:scheduleId`
여행 일정 상세 조회

**Auth** 필요

**Response 200**
```json
{
  "success": true,
  "data": {
    "scheduleId": 1,
    "title": "string",
    "destination": "string",
    "startDate": "string",
    "endDate": "string",
    "days": [ ]
  }
}
```

---

### DELETE `/schedules/:scheduleId`
여행 일정 삭제

**Auth** 필요

**Response 200**
```json
{
  "success": true,
  "message": "일정이 삭제되었습니다"
}
```

---

## 5. AI 기능

### POST `/ai/analyze/image`
사진 분석 → 여행지 추천

**Auth** 필요

**Request Body** (multipart/form-data)
```
image: File
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "analysis": "따뜻하고 활동적인 분위기의 사진입니다",
    "recommendations": [
      {
        "destination": "제주도",
        "reason": "활동적인 액티비티와 따뜻한 날씨",
        "tags": ["액티비티", "자연"]
      }
    ]
  }
}
```

---

### POST `/ai/analyze/voice`
음성 분석 → 여행지 추천

**Auth** 필요

**Request Body** (multipart/form-data)
```
audio: File
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "transcript": "조용하고 힐링되는 곳에 가고 싶어요",
    "recommendations": [
      {
        "destination": "남해",
        "reason": "조용한 자연 속 힐링 여행지",
        "tags": ["힐링", "자연"]
      }
    ]
  }
}
```

---

### POST `/ai/chat`
AI 여행 챗봇 대화

**Auth** 필요

**Request Body**
```json
{
  "message": "제주도에서 아이랑 가기 좋은 곳 추천해줘",
  "sessionId": "string | null"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "sessionId": "abc123",
    "reply": "제주도에서 아이와 함께 가기 좋은 곳을 추천해드릴게요...",
    "recommendations": []
  }
}
```

---

## 6. 피드 (Feed)

### GET `/feed`
여행 피드 목록 조회

**Auth** 필요

**Query Params**
- `page` (number, default: 1)
- `limit` (number, default: 10)

**Response 200**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "postId": 1,
        "author": { "userId": 2, "nickname": "string", "profileImage": "string" },
        "destination": "제주도",
        "imageUrl": "string",
        "content": "string",
        "likes": 12,
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "totalCount": 100,
    "currentPage": 1
  }
}
```

---

### POST `/feed`
피드 게시물 작성

**Auth** 필요

**Request Body** (multipart/form-data)
```
image: File
content: string
destination: string
scheduleId: number (optional)
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "postId": 1
  }
}
```

---

## 에러 코드 정리

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `UNAUTHORIZED` | 401 | 인증 토큰 없음 또는 만료 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `EMAIL_EXISTS` | 409 | 이메일 중복 |
| `INVALID_CREDENTIALS` | 401 | 로그인 실패 |
| `VALIDATION_ERROR` | 400 | 요청 데이터 유효성 오류 |
| `SERVER_ERROR` | 500 | 서버 내부 오류 |