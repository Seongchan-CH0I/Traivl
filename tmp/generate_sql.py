import json

with open('c:/Traivl/Traivl/tmp/data_40_places.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

sql_header = """-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- Destination: 8개 고정 추천 도시
-- =============================================
INSERT INTO "Destination" (id, name, country, "dnaType", description, "imageUrl") VALUES
  ('JP_KYOTO',   '교토, 일본',      '일본', '클래식 슬로우뷰어',   '천년 고도의 사찰과 전통 거리를 천천히 거니는 고즈넉한 여행',  '/images/JP_KYOTO.jpg'),
  ('JP_OSAKA',   '오사카, 일본',    '일본', '본투비 푸드파이터',   '눈과 입이 쉴 틈 없는 도톤보리의 먹방 풀코스',               '/images/JP_OSAKA.jpg'),
  ('JP_TOKYO',   '도쿄, 일본',      '일본', '프리미엄 쇼퍼홀릭',  '화려한 도심 속 세련된 쇼핑과 전략적인 럭셔리 소비',          '/images/JP_TOKYO.jpg'),
  ('JP_OKINAWA', '오키나와, 일본',  '일본', '욜로 즉흥러',         '렌터카로 달리는 푸른 해변, 가성비로 챙기는 즉흥 여행',       '/images/JP_OKINAWA.jpg'),
  ('KR_JEJU',    '제주도, 한국',    '한국', '힐링 럭셔리러',       '아름다운 자연 속에서 누리는 여유롭고 프라이빗한 휴식',        '/images/KR_JEJU.jpg'),
  ('KR_SOKCHO',  '속초/강릉, 한국', '한국', '푸드트립 가성비러',   '바다를 보며 즐기는 맛있는 현지 음식과 합리적인 식도락 여행',  '/images/KR_SOKCHO.jpg'),
  ('KR_SEOUL',   '서울, 한국',      '한국', '컬처 트렌드세터',     '박물관, 전시회부터 SNS 핫플까지 도심 속 다채로운 문화 체험',  '/images/KR_SEOUL.jpg'),
  ('KR_BUSAN',   '부산, 한국',      '한국', '액티비티 어드벤처러', '활기찬 해양 스포츠와 매력적인 현지 명소 탐험',               '/images/KR_BUSAN.jpg')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Place: 도시별 인기 장소 (관광지 + 맛집)
-- =============================================
"""

sql_body = ""
for dest_id, places in data.items():
    sql_body += f"\n-- {dest_id}\n"
    sql_body += 'INSERT INTO "Place" ("destinationId", name, category, description, "imageUrl", rank, address, latitude, longitude, "openingHours", "phoneNumber", tags, "averagePrice", rating) VALUES\n'
    
    place_strings = []
    for p in places:
        # Handle single quotes in strings
        name = p['name'].replace("'", "''")
        category = p['category'].replace("'", "''")
        description = p['description'].replace("'", "''")
        address = p['address'].replace("'", "''")
        hours = p['hours'].replace("'", "''")
        phone = p['phone'].replace("'", "''")
        
        # Tags formatting: ARRAY['#tag1', '#tag2']
        tags_str = "ARRAY[" + ", ".join([f"'{t}'" for t in p['tags']]) + "]"
        
        place_strings.append(f"  ('{dest_id}', '{name}', '{category}', '{description}', '{p['imageUrl']}', {p['rank']}, '{address}', {p['lat']}, {p['lng']}, '{hours}', '{phone}', {tags_str}, {p['price']}, {p['rating']})")
    
    sql_body += ",\n".join(place_strings) + ";\n"

with open('c:/Traivl/Traivl/database/init.sql', 'w', encoding='utf-8') as f:
    f.write(sql_header + sql_body)
