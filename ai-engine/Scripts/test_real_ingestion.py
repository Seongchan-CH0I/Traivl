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

    # -------------------------------------------------------------------

    print("\n🔍 [Step 4] 프론트엔드 JSON 요청 기반 벡터 DB 검색 테스트!")
    mock_request = {"country": "일본", "destination": "도쿄", "travel_style": ["쇼핑", "역사 및 문화"]}
    search_query = f"{', '.join(mock_request['travel_style'])} 분위기가 가득한 장소"  

    results = vector_db.similarity_search(
        query=search_query, 
        k=2, 
        filter={"destination": mock_request["destination"]}
    )
    
    # [디버그용] DB에 문서가 몇개나 저장되었나 확인
    print(f"  [DB 카운트] 총 {vector_db._collection.count()}개의 데이터가 저장되어 있습니다.")

    print("\n🤖 벡터 DB의 최종 검색 결과:")
    for idx, doc in enumerate(results, 1):
        print(f"  {idx}등: {doc.metadata['name']} (소요시간: {doc.metadata['duration_mins']}분)")

    # -------------------------------------------------------------------

    print("\n📍 [Step 5] 파이썬 백엔드의 마법: 동선(거리) 최적화 로직 맛보기")
    
    # 방금 찾은 장소가 2개가 안 될 경우를 대비한 안전 방어막
    if len(results) < 2:
        print(f"  🚨 [에러] 검색된 장소가 2개 미만입니다. 현재 개수: {len(results)}개")
        print("  💡 (해결책) 벡터 DB에 데이터가 제대로 들어갔는지 또는 필터가 너무 빡빡한지 확인해야 합니다.")
        return
        
    place1 = results[0].metadata
    place2 = results[1].metadata

    # 파이썬으로 두 장소 간의 물리적 직선거리를 즉시 계산합니다.
    distance_km = calculate_distance(place1["lat"], place1["lng"], place2["lat"], place2["lng"])
    
    print(f"  👉 계산 결과: [{place1['name']}]와 [{place2['name']}] 간의 거리는 약 {distance_km:.1f} km 입니다.")
    
    if distance_km > 10.0:
        print(f"  🚨 [경고] 거리가 10km를 넘습니다! 두 장소를 같은 날 일정에 묶으면 유저가 길바닥에 시간을 다 버립니다!")
        print(f"  💡 [AI 프롬프트 생성기] -> OpenAI에게 '이 둘은 하루에 묶지 마'라고 강력하게 경고 조건을 추가해서 보냅니다.")
    else:
        print(f"  ✅ [통과] 거리가 아주 가깝네요! 두 장소를 기분 좋게 같은 날 오전/오후 일정으로 묶어서 OpenAI에게 일정을 써달라고 던집니다.")

if __name__ == "__main__":
    main()