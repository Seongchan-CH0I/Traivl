# ai-engine/scripts/fetch_google_places.py

import os
import sys
import json
import requests
import time
from dotenv import load_dotenv

# 부모 폴더 경로 추가 (.env 파일 읽기 및 data 폴더 생성 목적)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

if not GOOGLE_API_KEY or GOOGLE_API_KEY.startswith("AIzaSy..."):
    raise ValueError(".env 파일에 실제 발급받은 GOOGLE_MAPS_API_KEY를 적어주세요")

# 수집된 데이터를 저장할 JSON 파일 경로
DATA_OUTPUT_PATH = os.path.join(BASE_DIR, "data", "places_raw.json")

def fetch_places(search_query):
    """
    구글 Places API (New) 통신 함수
    """
    url = "https://places.googleapis.com/v1/places:searchText"
    
    # 구글 서버에 요구할 데이터 뼈대 조합
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        # 필요한 핵심 데이터 필드만 나오게 필터링
        "X-Goog-FieldMask": "places.id,places.displayName,places.editorialSummary,places.location"
    }
    
    payload = {
        "textQuery": search_query,
        "languageCode": "ko" # 한국어 설명글 우선 요청
    }
    
    print(f"📡 구글 API 호출 중... [검색어: {search_query}]")
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code != 200:
        print(f"❌ API 오류: {response.text}")
        return []

    data = response.json()
    return data.get("places", [])

def get_country_for_city(city):
    japan_cities = ["도쿄", "오사카", "후쿠오카", "교토", "삿포로", "나고야"]
    korea_cities = ["서울", "부산", "제주", "인천", "경주"]
    if city in japan_cities:
        return "일본"
    elif city in korea_cities:
        return "대한민국"
    return "알 수 없음"

def main():
    print("🚀 [수집 봇 가동] 구글 맵스 파이프라인 시작!\n")
    
    # 안전장치: data 폴더가 없으면 에러 나기 전에 파이썬이 스스로 폴더를 만듦
    os.makedirs(os.path.dirname(DATA_OUTPUT_PATH), exist_ok=True)
    
    # CLI 파라미터로 도시를 받을 수 있도록 수정
    if len(sys.argv) > 1:
        target_cities = sys.argv[1:]
    else:
        target_cities = ["도쿄"] # 기본값
        
    # 프론트엔드에서 넘어오는 10가지 태그 적용
    target_themes = ["졸업여행", "인스타감성", "맛집투어", "문화체험", "힐링", 
                    "액티비티", "쇼핑", "야경투어", "역사탐방", "자연"]
    
    all_raw_places = []
    
    for city in target_cities:
        country = get_country_for_city(city)
        for theme in target_themes:
            query = f"{city} {theme}"
            api_places = fetch_places(query)
            
            # API에서 받은 복잡한 JSON 결과를 우리가 다루기 쉬운 규격으로 예쁘게 깎아내기
            for p in api_places:
                # 설명(summary)이 없는 장소(보통 구멍가게나 폐업 상태)는 과감히 버림!
                if "editorialSummary" not in p:
                    continue
                
                place_data = {
                    "id": p["id"],
                    "name": p["displayName"].get("text", "이름 없음"),
                    "desc": p["editorialSummary"].get("text", "설명 없음"),
                    "country": country,             
                    "destination": city,           
                    "lat": float(p["location"]["latitude"]),
                    "lng": float(p["location"]["longitude"]),
                    "tags": [theme],     # 검색 태그 저장
                    "duration_mins": 90  # 임시 고정값
                }
                all_raw_places.append(place_data)
            
            # 구글 서버 과부하나 블락(Block) 방지를 위해 매 검색마다 2초씩 휴식 매너 장착
            time.sleep(2)

    # 파싱된 깔끔한 데이터들을 메모리에서 사라지기 전에 하드디스크(.json)로 통째로 덤프(저장)!
    print(f"\n✅ 수집 완료! 총 {len(all_raw_places)}개의 유효한 장소를 확보했습니다.")
    
    with open(DATA_OUTPUT_PATH, "w", encoding="utf-8") as f:
        # indent=4 는 JSON 파일 내부를 엑셀처럼 사람이 읽기 예쁘게 줄바꿈해 주는 마법입니다
        json.dump(all_raw_places, f, ensure_ascii=False, indent=4)
        
    print(f"📁 구글 데이터 저장 성공! (위치: {DATA_OUTPUT_PATH})")
    print("이제부터 이 파일은 평생 무료이므로, 마음껏 무한정 임베딩하세요!")

if __name__ == "__main__":
    main()
