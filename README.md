# Traivl - 프로젝트 개발 환경 세팅 가이드 (팀원용)

## 🛠 필수 사전 설치 프로그램
이 프로젝트를 로컬에서 돌리기 위해서는 다음 두 가지 프로그램이 반드시 필요합니다.
1. **Node.js** (버전 18 이상 권장)
2. **Docker Desktop** (DB 컨테이너 실행용)

---

## 🚀 Step-by-Step 로컬 환경 세팅 방법

### 1단계: 프로젝트 클론 및 패키지 설치
먼저 터미널을 열고 깃허브에서 프로젝트를 복제한 뒤, 필수 라이브러리(Next.js, Prisma 등)를 설치합니다.

```bash
git clone [우리 프로젝트 레포지토리 주소]
cd Traivl
npm install
```

### 2단계: 로컬 환경 변수(`.env`) 세팅
데이터베이스 접속 주소를 로컬에 세팅해야 합니다.
프로젝트 루트 폴더(가장 바깥 경로)에 `.env` 파일을 새로 만들고, 아래의 내용을 그대로 복사해서 붙여넣습니다.

```env
DATABASE_URL="postgresql://postgres:password@127.0.0.1:5432/traivldb"
```

### 3단계: 도커를 이용한 데이터베이스 실행
저희는 복잡한 DB 설치 과정을 없애기 위해 Docker를 활용합니다. (주의: 프론트엔드/백엔드 서버는 도커로 띄우지 않습니다!)
터미널(프로젝트 루트 경로)에서 다음 명령어를 실행하여 PostgreSQL 데이터베이스 컨테이너만 백그라운드에 띄웁니다.

```bash
docker-compose up -d
```
> 💡 참고: 이 명령어를 실행하면 `traivl-postgres`라는 이름의 컨테이너가 5432 포트로 띄워지게 됩니다. 3000번 포트 충돌을 막기 위해 앱은 `npm run dev`로 따로 실행합니다.
### 4단계: DB 테이블 생성 및 Prisma 동기화 (마이그레이션)
도커 DB가 정상적으로 켜졌다면, 미리 설계된 `schema.prisma` 파일(설계도)을 빈 데이터베이스에 밀어 넣고 테이블(건물)을 생성해야 합니다.
터미널에서 아래 명령어를 실행하세요.

```bash
npx prisma generate
npx prisma migrate dev
```
> 💡 참고: 마이그레이션 도중 에러("Can't reach database server...")가 발생한다면, **도커 컨테이너가 정상적으로 실행 중(`Up`)인지 켜진 것을 반드시 확인**하세요.

### 5단계: Next.js 프론트엔드/백엔드 서버 실행
데이터베이스 세팅까지 완벽하게 끝났습니다! 이제 개발 화면을 띄워봅시다.

```bash
npm run dev
```

터미널에 `ready started server on 0.0.0.0:3000` 문구가 뜨면 브라우저를 열고 **http://localhost:3000** 에 접속하여 개발을 시작하시면 됩니다!

---

## 🚨 자주 발생하는 문제 해결 (Troubleshooting)

**Q. 도커를 띄우려는데(Step 3) "Port is already allocated" (5432 포트 충돌) 에러가 나요.**
A. 본인 PC에 예전에 개발 공부 등으로 설치해둔 PostgreSQL이 직접 켜져 있어서 포트 번호(5432)가 겹치는 현상입니다. 
- 해결 방법: 윈도우/맥 자체에 깔려있는 로컬 PostgreSQL 프로그램의 작동을 완전히 정지시킨 뒤 도커를 다시 켜주세요.

**Q. 마이그레이션(Step 4)에서 "password authentication failed for user 'postgres'" 같은 에러가 뜹니다.**
A. 가장 흔한 에러입니다. 예전에 실수로 `root` 계정으로 도커 볼륨(데이터 찌꺼기)을 만들어 두었기 때문입니다.
- 해결 방법: 기존 도커 볼륨을 완전히 박살내고 초기화해야 합니다. 터미널에 `docker-compose down -v` 를 입력해 찌꺼기를 날려버린 후, 다시 3단계(`docker-compose up -d db`)부터 차근차근 진행하세요.

---

## 📝 [팀 약속] 커밋 메시지 규칙 (Conventional Commits)

우리 프로젝트는 깔끔한 깃(Git) 히스토리 관리를 위해 **Husky + Commitlint 검사기가 강제 적용**되어 있습니다.
`npm install`을 완료한 시점부터 터미널에서 룰에 맞지 않는 커밋을 작성하면 **저장이 거부(에러)됩니다.**

다음 템플릿(`타입: 제목`) 형식을 무조건 지켜주세요!

### 📌 사용 가능한 접두어(타입) 목록
* **`feat:`** 새로운 기능, 페이지, 시스템 추가 시
* **`fix:`** 버그, 오류, 에러 해결 시
* **`docs:`** README 파일 등 문서 작성/수정 시
* **`chore:`** 시스템 설정, 패키지 설치(`npm install`), 환경 세팅 등을 변경했을 때
* **`refactor:`** 기능은 같지만 코드 구조를 리팩토링했을 때
* **`style:`** 코드 포맷팅, 띄어쓰기, 주석 등 로직과 무관한 글자를 수정했을 때

### ✅ 올바른 커밋 작성 예시
```bash
# 통과되는 예시 (콜론 뒤에 띄어쓰기 1칸 필수!)
git commit -m "feat: 마이페이지 레이아웃 컴포넌트 추가"
git commit -m "fix: 회원가입 시 비밀번호 유효성 검사 버그 수정"

# ❌ 거부되는 예시 (에러 뿜고 튕김)
git commit -m "마이페이지 수정완료ㅋㅋ"
git commit -m "feat 마이페이지"
git commit -m "Feat: 대문자시작"
```

# Traivl Integration - 로컬 개발 및 도커 환경 네트워크 가이드

이 프로젝트는 **Next.js(프론트/백엔드)**, **FastAPI(AI 엔진)**, **PostgreSQL(pgvector)**, **Redis(캐시)**로 구성된 통합 개발 환경입니다. 로컬 개발 환경과 도커 통합 환경에서의 원활한 통신을 위해 아래 가이드를 참고해 주세요.

## 📂 데이터베이스 & 팀 협업 가이드 (필독!)
팀원들과 DB 구조나 데이터를 공유할 때 필요한 절차와 명령어는 아래 전용 가이드를 참고해 주세요.
👉 **[데이터베이스 & Prisma 협업 가이드 바로가기 (README_DB.md)](./README_DB.md)**

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
