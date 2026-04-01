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

load_dotenv()

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

    # 🚨 [새로 추가된 핵심 로직] Python 단에서 중복 장소 싹 제거하기! (Deduplication)
    # 구글에서 '쇼핑'으로도 뽑히고 '관광명소'로도 겹쳐서 뽑힌 장소들(예: 도쿄 타워)이 
    # 배치 안에 두 번 들어가면 ChromaDB가 화를 냅니다. 그래서 넣기 전에 고유 ID로 싹 한 번 걸러냅니다!
    unique_places_dict = {}
    for place in raw_places:
        unique_places_dict[place['id']] = place
    
    unique_raw_places = list(unique_places_dict.values())

    documents = [
        Document(
            page_content=f"{place['name']} - {place['desc']}", 
            metadata={
                "place_id": place['id'], 
                "name": place['name'],
                "country": place['country'],
                "destination": place['destination'],
                "lat": place['lat'],                  # 📍 위도
                "lng": place['lng'],                  # 📍 경도
                "duration_mins": place['duration_mins'] # ⏱️ 예상 소요 시간
            }
        ) for place in unique_raw_places
    ]

    print("\n🧬 [Step 2 & 3] 임베딩 및 로컬 벡터 DB(Chroma)에 적재 (중복 방지 로직 적용)")
    embeddings_model = HuggingFaceEmbeddings(model_name="jhgan/ko-sbert-nli")
    
    # 이제 구글이 준 '절대 변하지 않는 고유 ID(place_id)'를 라벨지로 붙여서 넣습니다!
    # 이렇게 하면 똑같은 장소가 '쇼핑'과 '역사' 테마 두 곳에서 수집되어 2번 들어와도,
    # 크로마 DB가 덮어씌워 버리기 때문에 절대 중복 데이터가 쌓이지 않습니다!
    unique_ids = [doc.metadata["place_id"] for doc in documents]
    
    vector_db = Chroma.from_documents(
        documents=documents, 
        embedding=embeddings_model,
        persist_directory="./chroma_real_db",
        ids=unique_ids
    )

    print("\n🎉 데이터 적재 완료! 이제 ChromaDB가 FastAPI 백엔드(plan_service.py)의 요청을 받을 준비가 되었습니다.")

if __name__ == "__main__":
    main()