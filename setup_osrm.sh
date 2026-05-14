#!/bin/bash
# OSRM 지도 데이터 다운로드 및 전처리 스크립트 (Kanto 지역 - 도쿄 포함)

echo "=========================================="
echo "🚗 OSRM 로컬 데이터 세팅을 시작합니다..."
echo "=========================================="

# 데이터를 저장할 폴더 생성
mkdir -p osrm-data
cd osrm-data

# Kanto(도쿄 지역) OSM 데이터 다운로드
if [ ! -f "kanto-latest.osm.pbf" ]; then
    echo "📥 1. Kanto 지역 OpenStreetMap 데이터 다운로드 중..."
    curl -L -O http://download.geofabrik.de/asia/japan/kanto-latest.osm.pbf
else
    echo "✅ 1. kanto-latest.osm.pbf 파일이 이미 존재합니다. 다운로드를 건너뜁니다."
fi

# 도커를 이용한 OSRM 데이터 추출 (차량 프로파일 사용)
echo "⚙️ 2. 지도 데이터 추출 중 (osrm-extract) ..."
docker run -t -v $(pwd):/data osrm/osrm-backend osrm-extract -p /opt/car.lua /data/kanto-latest.osm.pbf

echo "⚙️ 3. 지도 데이터 파티셔닝 중 (osrm-partition) ..."
docker run -t -v $(pwd):/data osrm/osrm-backend osrm-partition /data/kanto-latest.osrm

echo "⚙️ 4. 지도 데이터 커스터마이징 중 (osrm-customize) ..."
docker run -t -v $(pwd):/data osrm/osrm-backend osrm-customize /data/kanto-latest.osrm

echo "=========================================="
echo "🎉 OSRM 데이터 전처리가 완료되었습니다!"
echo "이제 docker-compose up -d 를 통해 OSRM 컨테이너를 실행할 수 있습니다."
echo "=========================================="
