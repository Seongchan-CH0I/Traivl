import os
import sys
import json
import requests
import time
from dotenv import load_dotenv

# 환경 변수 로드 (.env 파일 경로 정확히 지정)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.dirname(BASE_DIR)
sys.path.append(BASE_DIR)

load_dotenv(os.path.join(ROOT_DIR, ".env"))
GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

if not GOOGLE_API_KEY or GOOGLE_API_KEY.startswith("AIzaSy..."):
    raise ValueError(".env 파일에 실제 발급받은 GOOGLE_MAPS_API_KEY를 적어주세요")

# 데이터 저장 경로
DATA_OUTPUT_PATH = os.path.join(BASE_DIR, "data", "places_raw.json")

# 최대 수집 페이지 (과금 및 시간 방지용, 1페이지당 20개)
MAX_PAGES = 3

# 1. 구글 맞춤형 검색어 -> 서비스 내부 태그 매핑 사전
THEME_MAPPING = {
    "유명 관광지": ["문화체험", "역사탐방"],
    "인스타감성 예쁜 카페": ["인스타감성", "힐링"],
    "현지인 추천 맛집": ["맛집투어"],
    "대형 쇼핑몰 및 백화점": ["쇼핑", "졸업여행"],
    "야경 명소 및 전망대": ["야경투어", "인스타감성"],
    "테마파크 및 액티비티": ["액티비티", "졸업여행"],
    "아름다운 공원 및 자연": ["자연", "힐링"]
}

# 2. 동적 그리드(바둑판) 생성 함수
def generate_grids(name, north, south, west, east, rows, cols):
    grids = []
    lat_step = (north - south) / rows
    lng_step = (east - west) / cols
    for r in range(rows):
        for c in range(cols):
            grids.append({
                "name": f"{name} 구역({r+1},{c+1})",
                "low": {"latitude": south + r*lat_step, "longitude": west + c*lng_step},
                "high": {"latitude": south + (r+1)*lat_step, "longitude": west + (c+1)*lng_step}
            })
    return grids

# 3. 타겟 도시 및 그리드 설정 (21개 글로벌 도시, 각각 크기에 맞게 등분)
TARGET_CITIES = {
    # ── 일본 ──
    "도쿄": generate_grids("도쿄", 35.75, 35.60, 139.60, 139.85, 2, 2), # 4구역
    "오사카": generate_grids("오사카", 34.75, 34.60, 135.40, 135.60, 2, 2), # 4구역
    "교토": generate_grids("교토", 35.05, 34.95, 135.70, 135.85, 2, 2), # 4구역
    "후쿠오카": generate_grids("후쿠오카", 33.65, 33.50, 130.30, 130.50, 2, 2), # 4구역
    "오키나와": generate_grids("오키나와", 26.45, 26.25, 127.65, 127.85, 2, 2), # 4구역 (나하 중심)
    # ── 한국 ──
    "서울": generate_grids("서울", 37.70, 37.40, 126.75, 127.20, 3, 3), # 9구역
    "부산": generate_grids("부산", 35.30, 35.00, 128.80, 129.30, 2, 2), # 4구역
    "제주도": generate_grids("제주도", 33.60, 33.20, 126.15, 126.95, 2, 2), # 4구역
    "속초": generate_grids("속초", 38.25, 38.10, 128.40, 128.65, 2, 2), # 4구역
    # ── 태국 ──
    "방콕": generate_grids("방콕", 13.85, 13.65, 100.40, 100.65, 2, 2), # 4구역
    "치앙마이": generate_grids("치앙마이", 18.85, 18.72, 98.92, 99.05, 2, 2), # 4구역
    "푸켓": generate_grids("푸켓", 7.95, 7.75, 98.28, 98.45, 2, 2), # 4구역
    # ── 베트남 ──
    "하노이": generate_grids("하노이", 21.10, 20.95, 105.78, 105.92, 2, 2), # 4구역
    "다낭": generate_grids("다낭", 16.12, 15.98, 108.15, 108.30, 2, 2), # 4구역
    "호치민": generate_grids("호치민", 10.85, 10.72, 106.60, 106.75, 2, 2), # 4구역
    # ── 싱가포르 ──
    "싱가포르": generate_grids("싱가포르", 1.38, 1.24, 103.75, 103.90, 2, 2), # 4구역
    # ── 대만 ──
    "타이베이": generate_grids("타이베이", 25.12, 24.96, 121.47, 121.60, 2, 2), # 4구역
    "가오슝": generate_grids("가오슝", 22.70, 22.58, 120.25, 120.38, 2, 2), # 4구역
    # ── 인도네시아 ──
    "발리": generate_grids("발리", -8.20, -8.85, 115.05, 115.50, 2, 2), # 4구역
    # ── 프랑스 ──
    "파리": generate_grids("파리", 48.92, 48.82, 2.25, 2.42, 2, 2), # 4구역
    # ── 영국 ──
    "런던": generate_grids("런던", 51.56, 51.46, -0.20, 0.00, 2, 2), # 4구역
    # ── 이탈리아 ──
    "로마": generate_grids("로마", 41.95, 41.85, 12.42, 12.55, 2, 2), # 4구역
    # ── 스페인 ──
    "바르셀로나": generate_grids("바르셀로나", 41.43, 41.35, 2.12, 2.22, 2, 2), # 4구역
    # ── 네덜란드 ──
    "암스테르담": generate_grids("암스테르담", 52.40, 52.33, 4.85, 4.95, 2, 2), # 4구역
    # ── 스위스 ──
    "취리히": generate_grids("취리히", 47.42, 47.33, 8.48, 8.58, 2, 2), # 4구역
    # ── 독일 ──
    "베를린": generate_grids("베를린", 52.56, 52.46, 13.32, 13.48, 2, 2), # 4구역
    # ── 미국 ──
    "뉴욕": generate_grids("뉴욕", 40.82, 40.70, -74.05, -73.90, 2, 2), # 4구역
    "로스앤젤레스": generate_grids("로스앤젤레스", 34.15, 33.95, -118.40, -118.15, 2, 2), # 4구역
    "하와이": generate_grids("하와이", 21.35, 21.22, -157.90, -157.75, 2, 2), # 4구역 (호놀룰루 중심)
    # ── 페루 ──
    "쿠스코": generate_grids("쿠스코", -13.48, -13.55, -72.00, -71.92, 2, 2), # 4구역
    # ── 호주 ──
    "시드니": generate_grids("시드니", -33.80, -33.92, 151.15, 151.30, 2, 2), # 4구역
    # ── 이집트 ──
    "카이로": generate_grids("카이로", 30.10, 29.95, 31.18, 31.35, 2, 2), # 4구역
}

# 도시 → 국가 매핑 (장소 데이터에 country 필드 정확히 기입)
CITY_COUNTRY_MAP = {
    "서울": "대한민국", "부산": "대한민국", "제주도": "대한민국", "속초": "대한민국",
    "도쿄": "일본", "오사카": "일본", "교토": "일본", "후쿠오카": "일본", "오키나와": "일본",
    "방콕": "태국", "치앙마이": "태국", "푸켓": "태국",
    "하노이": "베트남", "다낭": "베트남", "호치민": "베트남",
    "싱가포르": "싱가포르",
    "타이베이": "대만", "가오슝": "대만",
    "발리": "인도네시아",
    "파리": "프랑스", "런던": "영국", "로마": "이탈리아", "바르셀로나": "스페인",
    "암스테르담": "네덜란드", "취리히": "스위스", "베를린": "독일",
    "뉴욕": "미국", "로스앤젤레스": "미국", "하와이": "미국",
    "쿠스코": "페루", "시드니": "호주", "카이로": "이집트",
}

def get_country_for_city(city):
    return CITY_COUNTRY_MAP.get(city, "기타")

def fetch_places_with_pagination(query, grid, page_token=None, max_retries=3):
    url = "https://places.googleapis.com/v1/places:searchText"
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.editorialSummary,places.location,nextPageToken"
    }
    
    payload = {
        "textQuery": query,
        "languageCode": "ko",
        "locationRestriction": {
            "rectangle": {
                "low": grid["low"],
                "high": grid["high"]
            }
        }
    }
    
    if page_token:
        payload["pageToken"] = page_token
        
    for attempt in range(max_retries):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            
            if response.status_code != 200:
                print(f"❌ API 오류: {response.text}")
                return [], None

            data = response.json()
            return data.get("places", []), data.get("nextPageToken", None)
            
        except requests.exceptions.RequestException as e:
            print(f"\n⚠️ 네트워크 일시적 끊김 발생 (재시도 {attempt+1}/{max_retries}회) - 3초 후 다시 시도합니다...")
            time.sleep(3)
            
    print("❌ 서버 응답이 없어 해당 페이지는 건너뜁니다.")
    return [], None

def main():
    print("🚀 [수집 봇 가동] 고도화된 구글 맵스 파이프라인 (그리드+페이지네이션) 시작!\n")
    os.makedirs(os.path.dirname(DATA_OUTPUT_PATH), exist_ok=True)
    
    # 터미널에서 인자를 받거나, 없으면 전체 도시 실행
    if len(sys.argv) > 1:
        selected_cities = [city for city in sys.argv[1:] if city in TARGET_CITIES]
    else:
        selected_cities = list(TARGET_CITIES.keys())
        
    if not selected_cities:
        print("❌ 유효한 도시가 선택되지 않았습니다. (도쿄, 오사카, 교토 중 선택)")
        return
        
    all_raw_places = []
    total_api_calls = 0
    
    for city_name in selected_cities:
        print(f"\n========================================")
        print(f"🌆 [{city_name}] 지역 크롤링 시작 (총 {len(TARGET_CITIES[city_name])}개 구역)")
        print(f"========================================")
        
        country = get_country_for_city(city_name)
        grids = TARGET_CITIES[city_name]
        
        for i, grid in enumerate(grids):
            print(f"\n🗺️  [그리드 {i+1}/{len(grids)}] {grid['name']} 탐색")
            
            for search_keyword, mapped_tags in THEME_MAPPING.items():
                query = f"{city_name} {search_keyword}"
                print(f"  🔍 검색어: '{search_keyword}' -> 맵핑: {mapped_tags}")
                
                current_page = 1
                next_page_token = None
                
                while current_page <= MAX_PAGES:
                    # 너무 자세한 로그 대신 간단한 점찍기로 변경 (화면 가독성)
                    print(f"    📄 {current_page}페이지 수집 중...", end=" ")
                    total_api_calls += 1
                    
                    places, next_page_token = fetch_places_with_pagination(query, grid, next_page_token)
                    
                    valid_places_count = 0
                    for p in places:
                        if "editorialSummary" not in p:
                            continue # 설명(summary)이 없으면 폐업/비인기 장소로 간주하고 버림
                        
                        place_data = {
                            "id": p["id"],
                            "name": p.get("displayName", {}).get("text", "이름 없음"),
                            "desc": p.get("editorialSummary", {}).get("text", "설명 없음"),
                            "country": country,             
                            "destination": city_name,           
                            "lat": float(p["location"]["latitude"]),
                            "lng": float(p["location"]["longitude"]),
                            "tags": mapped_tags, # 🌟 구글 맞춤형 키워드를 서비스 태그로 변환 저장
                            "duration_mins": 90  
                        }
                        all_raw_places.append(place_data)
                        valid_places_count += 1
                        
                    print(f"-> 유효 장소 {valid_places_count}개 획득")
                    
                    if not next_page_token:
                        break
                        
                    current_page += 1
                    time.sleep(2) # 구글 API 딜레이 매너
                    
                time.sleep(1) # 테마 전환 시 휴식

    # 덤프(저장) - 기존 places_raw.json이 있으면 병합(다른 도시로 나눠 실행해도 데이터 유실 없음)
    print(f"\n🎉 수집 대장정 완료!")
    print(f"📊 총 API 호출: {total_api_calls}회")
    print(f"📦 이번 실행으로 확보된 장소 데이터: {len(all_raw_places)}개")

    merged_places = {}
    if os.path.exists(DATA_OUTPUT_PATH):
        with open(DATA_OUTPUT_PATH, "r", encoding="utf-8") as f:
            for place in json.load(f):
                merged_places[place["id"]] = place

    for place in all_raw_places:
        place_id = place["id"]
        if place_id in merged_places:
            existing_tags = merged_places[place_id].get("tags", [])
            merged_places[place_id] = place
            merged_places[place_id]["tags"] = list(set(existing_tags + place.get("tags", [])))
        else:
            merged_places[place_id] = place

    with open(DATA_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(list(merged_places.values()), f, ensure_ascii=False, indent=4)

    print(f"📦 병합 후 총 장소 데이터: {len(merged_places)}개")
    print(f"📁 데이터 저장 성공: {DATA_OUTPUT_PATH}")
    print("👉 이제 'python ai-engine/Scripts/ingestion_pipeline.py' 를 실행해 DB에 적재하세요!")

if __name__ == "__main__":
    main()
