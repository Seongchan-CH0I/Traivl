#!/bin/bash
set -e

export PATH=/opt/homebrew/share/google-cloud-sdk/bin:$PATH

PROJECT_ID="traivl-ai-engine"
ZONE="asia-northeast3-a"
INSTANCE_NAME="traivl-ai-server"

echo "📦 [1/4] 소스코드 초고속 압축 중 (git, venv 등 임시 파일 제외)..."
tar -czf /tmp/deploy.tar.gz \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.venv' \
  --exclude='__pycache__' \
  --exclude='osrm-data' \
  ai-engine database docker-compose.ai.yml

echo "🚀 [2/4] GCP VM으로 파일 전송 중..."
gcloud compute scp /tmp/deploy.tar.gz $INSTANCE_NAME:~/ --zone=$ZONE

echo "⚡ [3/4] VM 내부 압축 해제 및 폴더 정리..."
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
  mkdir -p ~/Traivl-AI_engine/osrm-data && \
  tar -xzf ~/deploy.tar.gz -C ~/Traivl-AI_engine && \
  rm ~/deploy.tar.gz
"

echo "🔥 [4/4] AI 도커 컨테이너 빌드 및 최종 구동..."
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
  cd ~/Traivl-AI_engine && \
  sudo docker-compose -f docker-compose.ai.yml up -d --build
"

echo "🎉 AI 서버 배포 완료!"
echo "📍 VM 외부 IP: 34.64.252.63"
echo "🔗 AI API 주소: http://34.64.252.63:8000"
