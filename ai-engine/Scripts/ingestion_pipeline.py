# ai-engine/scripts/test_real_ingestion.py

import os
import sys
import math
import json
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

def main():
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
    
    # docker-compose.yml 기준 연결 정보
    # .env의 DATABASE_URL을 활용하고, 드라이버를 psycopg2로 보정
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5433/traivldb")
    CONNECTION_STRING = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    COLLECTION_NAME = "travel_places" # 테이블 이름 같은 역할 (원하는 이름 설정)
    
    # PGVector DB에 테이블/익스텐션 자동 생성 및 데이터 꽂아 넣기
    vector_db = PGVector.from_documents(
        embedding=embeddings_model,
        documents=documents,
        ids=unique_ids,
        collection_name=COLLECTION_NAME,
        connection_string=CONNECTION_STRING,
        pre_delete_collection=True # 스크립트를 재실행할 때마다 덮어씌울 거면 True
    )

    print("\n🎉 PostgreSQL에 데이터 적재 완료! pgvector 마이그레이션 성공!")

if __name__ == "__main__":
    main()