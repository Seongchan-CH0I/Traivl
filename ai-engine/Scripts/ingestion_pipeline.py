# ai-engine/scripts/test_real_ingestion.py

import os
import sys
import math
import json
import argparse
from urllib.parse import urlsplit
from dotenv import load_dotenv

# 부모 폴더 모듈 읽기용
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

# 상위 디렉토리의 .env를 찾아서 로드
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "../.env")
load_dotenv(dotenv_path=env_path)

# 🧮 두 위도/경도 간의 직선거리를 km 단위로 계산하는 공식 (Haversine)
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371.0 # 지구 반지름 (km)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# 🎯 적재 대상 DB를 결정 (우선순위: --db-url > TARGET_DATABASE_URL > SUPABASE_DATABASE_URL > DATABASE_URL)
def resolve_db_url(cli_db_url=None):
    candidates = [
        ("--db-url 인자", cli_db_url),
        ("TARGET_DATABASE_URL", os.getenv("TARGET_DATABASE_URL")),
        ("SUPABASE_DATABASE_URL", os.getenv("SUPABASE_DATABASE_URL")),
        ("DATABASE_URL", os.getenv("DATABASE_URL")),
    ]
    for source, url in candidates:
        if url:
            return source, url
    return "기본값", "postgresql://postgres:password@localhost:5433/traivldb"


def main():
    parser = argparse.ArgumentParser(description="places_raw.json을 임베딩해 pgvector에 적재합니다.")
    parser.add_argument("--db-url", help="적재할 대상 DB 접속 문자열 (미지정 시 환경변수 사용)")
    parser.add_argument("--replace", action="store_true",
                        help="기존 컬렉션을 통째로 지우고 새로 적재 (미지정 시 기존 데이터 유지하며 upsert)")
    args = parser.parse_args()

    print("🚀 [Step 1] 구글이 뱉어낸 진짜 데이터(places_raw.json) 로드 중...")
    
    # 1단계: 내 하드디스크에 저장해 둔 JSON 파일을 열어서 파이썬 변수로 빨아들이기!
    file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "places_raw.json")
    
    with open(file_path, "r", encoding="utf-8") as f:
        raw_places = json.load(f)

    # 🚨 [새로 추가된 핵심 로직] Python 단에서 중복 장소 병합 (여러 태그 누적!)
    unique_places_dict = {}
    for place in raw_places:
        place_id = place['id']
        if place_id in unique_places_dict:
            # 이미 존재하는 장소라면 기존 태그 목록에 새 태그를 추가 (중복 방지)
            existing_tags = unique_places_dict[place_id].get('tags', [])
            new_tags = place.get('tags', [])
            unique_places_dict[place_id]['tags'] = list(set(existing_tags + new_tags))
        else:
            if 'tags' not in place:
                place['tags'] = []
            unique_places_dict[place_id] = place
    
    unique_raw_places = list(unique_places_dict.values())

    documents = [
        Document(
            page_content=f"{place['name']} - {place['desc']} 카테고리: {', '.join(place.get('tags', []))}", 
            metadata={
                "place_id": place['id'], 
                "name": place['name'],
                "country": place['country'],
                "destination": place['destination'],
                "lat": place['lat'],                  # 📍 위도
                "lng": place['lng'],                  # 📍 경도
                "tags": place.get('tags', []),
                "duration_mins": place['duration_mins'] # ⏱️ 예상 소요 시간
            }
        ) for place in unique_raw_places
    ]

    print("\n🧬 [Step 2 & 3] 임베딩 및 글로벌 Vector DB(PostgreSQL+pgvector)에 적재 중...")
    embeddings_model = HuggingFaceEmbeddings(model_name="jhgan/ko-sbert-nli")
    
    unique_ids = [doc.metadata["place_id"] for doc in documents]
    
    # 🌟 Chrome 대신 PGVector 임포트 (파일 상단에 추가하셔도 됩니다)
    from langchain_community.vectorstores.pgvector import PGVector
    
    # 적재 대상 DB 결정 후, 드라이버를 psycopg2로 보정
    source, db_url = resolve_db_url(args.db_url)
    CONNECTION_STRING = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    COLLECTION_NAME = "travel_places" # 테이블 이름 같은 역할 (원하는 이름 설정)

    # 🚨 로컬에 넣을지 Supabase에 넣을지 눈으로 확인할 수 있게 대상 호스트를 출력 (비밀번호는 노출 금지)
    parsed = urlsplit(db_url)
    print(f"🎯 적재 대상: {parsed.hostname}:{parsed.port or 5432}{parsed.path} (출처: {source})")
    print(f"   모드: {'전체 교체(--replace)' if args.replace else '기존 유지 + upsert'}")

    # PGVector DB에 테이블/익스텐션 자동 생성
    vector_db = PGVector(
        embedding_function=embeddings_model,
        collection_name=COLLECTION_NAME,
        connection_string=CONNECTION_STRING,
        pre_delete_collection=args.replace # 재실행 시 기존 컬렉션을 통째로 날릴지 여부
    )

    # PGVector의 내부 저장은 upsert가 아닌 단순 insert라, 재실행 시 같은 장소가 중복으로 쌓입니다.
    # 전체 교체가 아닐 때는 이번에 넣을 place_id들만 미리 지워서 몇 번을 돌려도 결과가 같도록 보장합니다.
    if not args.replace:
        vector_db.delete(ids=unique_ids)

    # 데이터 꽂아 넣기
    vector_db.add_documents(documents, ids=unique_ids)

    print(f"\n🎉 {parsed.hostname}에 데이터 적재 완료! pgvector 마이그레이션 성공!")

if __name__ == "__main__":
    main()