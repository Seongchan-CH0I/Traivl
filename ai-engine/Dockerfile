FROM python:3.11-slim

# 시스템 의존성 설치 (OCR, 오디오 처리용)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 코드 변경 시 마운트된 볼륨을 사용하므로 COPY는 컨테이너 내부 환경 구축용입니다.
COPY . .

EXPOSE 8000

# uvicorn 서버 실행
# app.main:app 로 변경 (app 폴더 내부의 main.py 실행)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
