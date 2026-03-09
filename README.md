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
저희는 복잡한 DB 설치 과정을 없애기 위해 Docker를 활용합니다.
터미널(프로젝트 루트 경로)에서 다음 명령어를 실행하여 PostgreSQL(+pgvector) 데이터베이스 컨테이너를 백그라운드에 띄웁니다.

```bash
docker-compose up -d db
```
> 💡 참고: 이 명령어를 실행하면 `traivl-postgres`라는 이름의 컨테이너가 5432 포트로 띄워지게 됩니다.

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
