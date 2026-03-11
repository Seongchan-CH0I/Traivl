# Traivl Integration - 로컬 개발 및 도커 환경 네트워크 가이드

이 프로젝트는 **Next.js(프론트/백엔드)**, **FastAPI(AI 엔진)**, **PostgreSQL(pgvector)**, **Redis(캐시)**로 구성된 통합 개발 환경입니다. 로컬 개발 환경과 도커 통합 환경에서의 원활한 통신을 위해 아래 가이드를 참고해 주세요.

---

## 1. 환경 설정 (.env) 관리

`.env` 파일에는 서비스 간 통신을 위한 주소가 정의되어 있습니다. 현재 상황(로컬 개별 실행 vs 도커 통합 실행)에 맞게 주석을 해제하거나 설정하여 사용합니다.

### 💡 주요 규칙
- **로컬 개발용 (`localhost`)**: 각 서버(Next.js, FastAPI)를 터미널에서 직접 실행(`npm run dev`, `uvicorn ...`)할 때 사용합니다.
- **도커 통합용 (`service-name`)**: 모든 서비스를 `docker-compose up`으로 한꺼번에 띄워 도커 가상 네트워크 내에서 통신할 때 사용합니다.

---

## 2. 네트워크 시나리오별 설정 방법

### 시나리오 A: 모든 서비스를 로컬 터미널에서 직접 실행할 때
> 프론트/백엔드(`3000`), AI 서버(`8000`), DB/Redis(`도커로 실행 중`)가 모두 내 컴퓨터(Host)를 통해 통신하는 경우입니다.

- **설정 방식**: 모든 주소를 `localhost`로 설정합니다.
- **.env 예시**:
  ```env
  NEXT_PUBLIC_BASE_URL=http://localhost:3000
  NEXT_PUBLIC_AI_SERVER_URL=http://localhost:8000
  DATABASE_URL=postgresql://admin:password123@localhost:5432/travel_data
  REDIS_URL=redis://localhost:6379
  ```

### 시나리오 B: 모든 서비스를 도커로 한꺼번에 실행할 때 (`docker-compose up`)
> 모든 서비스가 도커 가상 네트워크(`travel-network`) 안에서 서로를 인식해야 하는 경우입니다.

- **설정 방식**: 주소를 도커 서비스 이름(`front_backend`, `ai-server`, `database`, `redis`)으로 설정합니다.
- **.env 예시**:
  ```env
  NEXT_PUBLIC_BASE_URL=http://front_backend:3000
  NEXT_PUBLIC_AI_SERVER_URL=http://ai-server:8000
  DATABASE_URL=postgresql://admin:password123@database:5432/travel_data
  REDIS_URL=redis://redis:6379
  ```

---

## 3. 로컬-도커 간 통신 문제 해결 (Troubleshooting)

### ❓ 내 컴퓨터에서 실행 중인 서버가 도커 안의 DB에 접속이 안 돼요.
- **원인**: 도커 컨테이너의 포트가 로컬 머신에 매핑되지 않았거나, 주소가 잘못되었을 수 있습니다.
- **해결**: `docker-compose.yml`에서 `ports: - "5432:5432"` 설정을 확인하고, 주소로 `localhost:5432`를 사용하세요.

### ❓ 도커 안에서 실행 중인 서버가 내 컴퓨터(로컬)의 특정 포트에 접속해야 해요.
- **원인**: 도커 컨테이너 내부에서 `localhost`는 **컨테이너 자기 자신**을 의미합니다. 내 컴퓨터(Host)를 의미하지 않습니다.
- **해결**: 주소에 `localhost` 대신 **`host.docker.internal`**을 사용하세요. (macOS/Windows 기준)
  - 예: 도커 내부의 Next.js가 로컬에서 따로 띄운 AI 서버에 접속할 때: `http://host.docker.internal:8000`

---

## 4. 실행 명령어 요약

1. **DB 및 Redis만 도커로 띄우기 (추천 로컬 개발 방식)**:
   ```bash
   docker-compose up -d database redis
   ```
   - 이후 Next.js와 FastAPI는 각자의 폴더에서 `npm run dev` 또는 `uvicorn`으로 실행.

2. **전체 시스템 통합 실행**:
   ```bash
   docker-compose up --build
   ```
   - 모든 수정사항이 반영된 상태로 통합 테스트 진행 시 사용.
