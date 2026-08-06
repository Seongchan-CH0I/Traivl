@echo off
echo ===================================================
echo  Traivl 로컬 개발 환경 자가진단 및 실행 스크립트
echo ===================================================

:: 1. Docker 실행 여부 확인
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [오류] Docker Desktop이 실행되어 있지 않습니다. 먼저 실행해 주세요.
    pause
    exit /b
)

:: 2. Docker 컨테이너 실행 및 빌드 확인
echo [1/3] Docker 컨테이너 상태 확인 및 실행 중...
docker compose up -d

:: 3. 데이터베이스 마이그레이션 및 시드 데이터 검사
echo [2/3] DB 마이그레이션 상태 확인 중...
cd front_backend
node scripts/sync-db.js

:: 4. Next.js 개발 서버 실행
echo [3/3] Next.js 프론트엔드 서버 실행 중...
npm run dev
