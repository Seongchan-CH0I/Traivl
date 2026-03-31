# ai-engine/scripts/test_real_ingestion.py

import os
import sys
import math
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
    print("🚀 [Step 1] 완벽한 실무형 데이터 수집 (위도/경도, 체류시간 꼬리표 추가)")
    
    # 교토 내의 실제 장소들 (동, 서, 남, 북 위치가 다름)
    raw_places = [
        # 교토 중심부 (동쪽) - 웅장함, 붐빔
        {"id": "p1", "name": "청수사", "desc": "가을 단풍이 아름다운 역사적인 웅장한 목조 사찰.", "country": "일본", "destination": "교토", "lat": 34.9948, "lng": 135.7850, "duration_mins": 120},
        # 교토 끝자락 오하라 (북동쪽 아주 먼 곳) - 힐링, 고요함, 자연
        {"id": "p2", "name": "호센인", "desc": "숲 한가운데 위치한 아주 조용하고 평화로운 사찰. 액자 정원으로 유명함.", "country": "일본", "destination": "교토", "lat": 35.1189, "lng": 135.8335, "duration_mins": 60},
        # 교토 북서쪽 - 화려함, 힐링
        {"id": "p3", "name": "금각사", "desc": "연못 위에 띄워진 눈부신 황금빛 누각과 힐링되는 정원 코스.", "country": "일본", "destination": "교토", "lat": 35.0394, "lng": 135.7292, "duration_mins": 60},
        # 교토 서부 (서쪽 끝) - 대자연, 힐링
        {"id": "p4", "name": "아라시야마 대나무숲", "desc": "교토 서쪽 끝을 장식하는 광활하고 끝없는 대나무 숲길. 대자연의 향기.", "country": "일본", "destination": "교토", "lat": 35.0094, "lng": 135.6668, "duration_mins": 90},
        # 다른 느낌의 장소도 하나 추가 (남쪽)
        {"id": "p5", "name": "후시미 이나리 대사", "desc": "수천 개의 붉은 토리이 길이 굽이치는 신비로운 하이킹 코스.", "country": "일본", "destination": "교토", "lat": 34.9671, "lng": 135.7727, "duration_mins": 120}
    ]

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
        ) for place in raw_places
    ]

    print("\n🧬 [Step 2 & 3] 임베딩 및 로컬 벡터 DB(Chroma)에 새로운 구조로 적재")
    embeddings_model = HuggingFaceEmbeddings(model_name="jhgan/ko-sbert-nli")
    
    vector_db = Chroma.from_documents(
        documents=documents, 
        embedding=embeddings_model,
        persist_directory="./chroma_real_db" 
    )

    # -------------------------------------------------------------------

    print("\n🔍 [Step 4] 프론트엔드 JSON 요청 기반 벡터 DB 검색 테스트!")
    mock_request = {"country": "일본", "destination": "교토", "travel_style": ["대자연", "힐링"]}
    search_query = f"{', '.join(mock_request['travel_style'])} 분위기가 가득한 장소"  
    
    # 🌟 "대자연, 힐링"을 검색했으므로 아마 [아라시야마]와 [호센인]이 뽑힐 확률이 높습니다!
    results = vector_db.similarity_search(
        query=search_query, 
        k=2, 
        filter={"$and": [{"country": mock_request["country"]}, {"destination": mock_request["destination"]}]}
    )

    print("\n🤖 벡터 DB의 최종 검색 결과:")
    for idx, doc in enumerate(results, 1):
        print(f"  {idx}등: {doc.metadata['name']} (소요시간: {doc.metadata['duration_mins']}분)")

    # -------------------------------------------------------------------

    print("\n📍 [Step 5] 파이썬 백엔드의 마법: 동선(거리) 최적화 로직 맛보기")
    
    # 방금 찾은 1등과 2등 장소의 메타데이터에서 좌표를 즉시 빼옵니다.
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