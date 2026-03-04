FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 코드 변경 시 마운트된 볼륨을 사용하므로 COPY는 컨테이너 내부 환경 구축용입니다.
COPY . .

EXPOSE 8000

# uvicorn 서버 실행 (--reload 옵션으로 코드 수정 시 자동 재시작)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]