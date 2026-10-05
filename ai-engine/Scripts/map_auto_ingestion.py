#!/usr/bin/env python3
"""
🌍 Traivl Automated Map Ingestion & GCS Cloud Uploader
도시 이름 하나만 입력하면 [지도 자동 다운로드 -> OSRM 1분 빌드 -> GCS 자동 업로드]까지 100% 자동 처리되는 파이프라인
"""

import os
import sys
import argparse
import subprocess
import urllib.request
from pathlib import Path

# AI 엔진 서비스 루트 경로 추가
sys.path.append(str(Path(__file__).resolve().parent.parent))
from app.services.gcs_service import gcs_service

MAP_URLS = {
    # 아시아 (Asia)
    "kanto": "https://download.geofabrik.de/asia/japan/kanto-latest.osm.pbf",
    "kansai": "https://download.geofabrik.de/asia/japan/kansai-latest.osm.pbf",
    "okinawa": "https://download.geofabrik.de/asia/japan/kyushu-latest.osm.pbf",
    "fukuoka": "https://download.geofabrik.de/asia/japan/kyushu-latest.osm.pbf",
    "seoul": "https://download.geofabrik.de/asia/south-korea-latest.osm.pbf",
    "bangkok": "https://download.geofabrik.de/asia/thailand-latest.osm.pbf",
    "singapore": "https://download.geofabrik.de/asia/malaysia-singapore-brunei-latest.osm.pbf",
    "taipei": "https://download.geofabrik.de/asia/taiwan-latest.osm.pbf",
    "hanoi": "https://download.geofabrik.de/asia/vietnam-latest.osm.pbf",
    "bali": "https://download.geofabrik.de/asia/indonesia-latest.osm.pbf",

    # 유럽 (Europe)
    "paris": "https://download.geofabrik.de/europe/france/ile-de-france-latest.osm.pbf",
    "london": "https://download.geofabrik.de/europe/great-britain/england/greater-london-latest.osm.pbf",
    "rome": "https://download.geofabrik.de/europe/italy/centro-latest.osm.pbf",
    "barcelona": "https://download.geofabrik.de/europe/spain/cataluna-latest.osm.pbf",
    "amsterdam": "https://download.geofabrik.de/europe/netherlands-latest.osm.pbf",
    "zurich": "https://download.geofabrik.de/europe/switzerland-latest.osm.pbf",

    # 북미 & 아메리카 (Americas)
    "new_york": "https://download.geofabrik.de/north-america/us/new-york-latest.osm.pbf",
    "los_angeles": "https://download.geofabrik.de/north-america/us/california-latest.osm.pbf",
    "hawaii": "https://download.geofabrik.de/north-america/us/hawaii-latest.osm.pbf",

    # 오세아니아 (Oceania)
    "sydney": "https://download.geofabrik.de/australia-oceania/australia/new-south-wales-latest.osm.pbf",

    # 아프리카 (Africa)
    "cairo": "https://download.geofabrik.de/africa/egypt-latest.osm.pbf"
}

def resolve_global_city_url(city: str) -> str:
    """전 세계 도시명을 입력받아 Geofabrik 다운로드 URL을 자동 추론하는 동적 매퍼"""
    city_key = city.lower().strip()
    if city_key in MAP_URLS:
        return MAP_URLS[city_key]
    
    return f"https://download.geofabrik.de/asia/{city_key}-latest.osm.pbf"

def run_cmd(cmd, cwd=None):
    print(f"🚀 [Auto Map Pipeline] 실행: {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"❌ [Error] 명령 실패: {res.stderr}")
        return False
    return True

def auto_ingest_map(city_name: str, current_idx: int = 1, total_count: int = 1):
    city = city_name.lower().strip()
    url = resolve_global_city_url(city)
    progress_pct = round((current_idx / total_count) * 100, 1)

    print(f"\n=======================================================")
    print(f"📊 [글로벌 구축 진행 현황: {current_idx}/{total_count} ({progress_pct}%)] - 대상 도시: [{city}]")
    print(f"=======================================================")

    # 0. GCS에 이미 완성된 20개 이상 파일이 있는지 확인 (이미 있으면 1초 만에 스킵!)
    try:
        existing_blobs = list(gcs_service.client.list_blobs(gcs_service.bucket_name, prefix=f"maps/{city}/"))
        if len(existing_blobs) >= 20:
            print(f"✨ [GCS 보관 확인 완료] [{city}] 지도는 이미 구글 클라우드에 100% 보관되어 있습니다. (자동 스킵 ✅)")
            return
    except Exception as e:
        pass

    work_dir = Path(__file__).resolve().parent.parent / "osrm-data" / city
    work_dir.mkdir(parents=True, exist_ok=True)
    
    pbf_filename = f"{city}-latest.osm.pbf"
    pbf_path = work_dir / pbf_filename

    # 1. curl -C - 로 끊긴 지점부터 100% 완전한 크기까지 완벽 이어받기
    print(f"⚡ [1/3 Step] 🌍 글로벌 도시 [{city}] 고속 다운로드 시작... ({url})")
    curl_cmd = f"curl -C - -L --retry 3 --retry-delay 2 -o \"{pbf_path}\" \"{url}\""
    download_success = run_cmd(curl_cmd)
    if not download_success or not pbf_path.exists() or pbf_path.stat().st_size < 1000000:
        print(f"❌ [{city}] URL 다운로드 실패 또는 파일 불완전")
        return
    print(f"⚡ [다운로드 완료] {pbf_path} (크기: {round(pbf_path.stat().st_size / 1024 / 1024, 1)} MB)")

    # 2. Docker OSRM 전처리 자동 빌드 (1분 만에 전처리)
    print(f"⚙️ [2/3 Step] OSRM 엔진으로 [{city}] 지도 1분 자동 전처리 빌드 중...")
    build_success = run_cmd(
        f"docker run --rm -v \"{work_dir}:/data\" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/{pbf_filename} && "
        f"docker run --rm -v \"{work_dir}:/data\" osrm/osrm-backend osrm-partition /data/{city}-latest.osrm && "
        f"docker run --rm -v \"{work_dir}:/data\" osrm/osrm-backend osrm-customize /data/{city}-latest.osrm"
    )

    if not build_success:
        print(f"❌ [{city}] OSRM 전처리 빌드에 실패했습니다. 깨진 PBF 삭제.")
        if pbf_path.exists(): pbf_path.unlink()
        return

    print(f"🎉 [2/3 Step] [{city}] OSRM 지도 파일 자동 빌드 완료!")

    # 3. GCS 클라우드 버킷으로 100% 자동 업로드
    print(f"☁️ [3/3 Step] 완성된 [{city}] 지도를 구글 클라우드(GCS) 버킷으로 100% 자동 업로드 중...")
    uploaded_count = 0
    for root, _, files in os.walk(work_dir):
        for f in files:
            if f.endswith(".osm.pbf"): continue # 원본 PBF 제외하고 OSRM 빌드 결과물만 업로드
            local_file_path = os.path.join(root, f)
            rel_path = os.path.relpath(local_file_path, work_dir)
            gcs_destination_path = f"maps/{city}/{rel_path}"
            if gcs_service.upload_file(local_file_path, gcs_destination_path):
                uploaded_count += 1

    print(f"✨ [완료] 글로벌 도시 [{city}] 지도 {uploaded_count}개 파일이 GCS 버킷에 100% 적재되었습니다!")

    # 4. 업로드 완료 후 로컬 디스크 용량 자동 청소 (맥북 디스크 보호!)
    for f in list(work_dir.glob("*")):
        try: f.unlink()
        except: pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Global Auto Map Ingestion CI/CD Pipeline")
    parser.add_argument("--city", type=str, default="kanto", help="자동 구축할 도시 이름")
    parser.add_argument("--global-all", action="store_true", help="21개 글로벌 도시 순차 일괄 자동 구축")
    args = parser.parse_args()
    
    if args.global_all:
        city_list = list(MAP_URLS.keys())
        total = len(city_list)
        print(f"🌐 [글로벌 일괄 구축 시작] 총 {total}개 도시 순차 파이프라인 가동...")
        for idx, city_name in enumerate(city_list, 1):
            auto_ingest_map(city_name, current_idx=idx, total_count=total)
    else:
        auto_ingest_map(args.city, 1, 1)
