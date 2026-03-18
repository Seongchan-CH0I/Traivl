-- pgvector 확장 활성화
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

-- 교토 (JP_KYOTO)
INSERT INTO "Place" ("destinationId", name, category, description, "imageUrl", rank) VALUES
  ('JP_KYOTO', '후시미 이나리 신사',   '관광지', '수천 개의 붉은 도리이가 이어진 신비로운 산길', 'https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?w=400&h=300&fit=crop', 1),
  ('JP_KYOTO', '기요미즈데라',         '관광지', '교토 동산 중턱의 웅장한 목조 사원',           'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop', 2),
  ('JP_KYOTO', '아라시야마 대나무숲',  '관광지', '하늘을 가득 채운 대나무 터널',                'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=300&fit=crop', 3),
  ('JP_KYOTO', '긴카쿠지 (은각사)',    '관광지', '고요한 정원과 은빛 누각의 조화',              'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop', 4),
  ('JP_KYOTO', '혼케 오와리야',        '맛집',   '500년 전통의 소바 전문점',                    'https://images.unsplash.com/photo-1552611052-33e04de081de?w=400&h=300&fit=crop',  1),
  ('JP_KYOTO', '교토 카츠쿠라',        '맛집',   '바삭한 정통 돈카츠와 특제 소스',              'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop', 2);

-- 오사카 (JP_OSAKA)
INSERT INTO "Place" ("destinationId", name, category, description, "imageUrl", rank) VALUES
  ('JP_OSAKA', '도톤보리',             '관광지', '오사카의 심장, 화려한 네온사인과 먹거리의 거리', 'https://images.unsplash.com/photo-1590559899595-e1fcbdb6f8e7?w=400&h=300&fit=crop', 1),
  ('JP_OSAKA', '오사카성',             '관광지', '일본 3대 명성 중 하나, 웅장한 역사 유적',       'https://images.unsplash.com/photo-1589452271712-64b8a66c7b71?w=400&h=300&fit=crop', 2),
  ('JP_OSAKA', '신세카이',             '관광지', '쿠시카츠와 레트로 감성이 넘치는 골목',          'https://images.unsplash.com/photo-1614899059803-5cca2196e7fe?w=400&h=300&fit=crop', 3),
  ('JP_OSAKA', '이치란라멘 본점',      '맛집',   '진한 돈코츠 육수의 원조 1인 칸막이 라멘',       'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop', 1),
  ('JP_OSAKA', '쿠로몬 시장',          '맛집',   '오사카의 부엌, 신선한 해산물과 먹거리 천국',    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',   2);

-- 도쿄 (JP_TOKYO)
INSERT INTO "Place" ("destinationId", name, category, description, "imageUrl", rank) VALUES
  ('JP_TOKYO', '시부야 스크램블 교차로', '관광지', '세계에서 가장 바쁜 횡단보도',                'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&h=300&fit=crop', 1),
  ('JP_TOKYO', '아사쿠사 & 센소지',     '관광지', '도쿄 최고(最古)의 사원과 나카미세 쇼핑거리', 'https://images.unsplash.com/photo-1583400701775-49f0e0dcfe3d?w=400&h=300&fit=crop', 2),
  ('JP_TOKYO', '하라주쿠 타케시타 거리','관광지', '팝컬처와 패션의 성지',                       'https://images.unsplash.com/photo-1541336032412-2048a678540d?w=400&h=300&fit=crop', 3),
  ('JP_TOKYO', '스키야바시 지로',       '맛집',   '미슐랭 3스타 전설의 스시 오마카세',           'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&h=300&fit=crop', 1),
  ('JP_TOKYO', '이치란 신주쿠점',       '맛집',   '도쿄 한복판에서 즐기는 혼자만의 라멘',        'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop', 2);

-- 오키나와 (JP_OKINAWA)
INSERT INTO "Place" ("destinationId", name, category, description, "imageUrl", rank) VALUES
  ('JP_OKINAWA', '에메랄드 비치',      '관광지', '새하얀 모래와 에메랄드빛 투명한 바다',        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', 1),
  ('JP_OKINAWA', '슈리성',             '관광지', '류큐 왕국의 역사를 담은 붉은 성',             'https://images.unsplash.com/photo-1614957004131-9e8f3b4b0c76?w=400&h=300&fit=crop', 2),
  ('JP_OKINAWA', '추라우미 수족관',    '관광지', '세계 최대급 수족관, 고래상어와 만남',         'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',   3),
  ('JP_OKINAWA', '마키시 공설시장',    '맛집',   '오키나와 현지인들의 부엌, 신선한 해산물',     'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',   1),
  ('JP_OKINAWA', '하마베노차야',       '맛집',   '오션뷰 카페, 오키나와 전통 빙수 젠자이',      'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&h=300&fit=crop', 2);

-- 제주도 (KR_JEJU)
INSERT INTO "Place" ("destinationId", name, category, description, "imageUrl", rank) VALUES
  ('KR_JEJU', '성산일출봉',            '관광지', '유네스코 세계자연유산, 일출 명소',            'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=300&fit=crop', 1),
  ('KR_JEJU', '한라산',                '관광지', '남한 최고봉, 다채로운 등산 코스',             'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',   2),
  ('KR_JEJU', '협재 해수욕장',         '관광지', '에메랄드빛 바다와 하얀 모래사장',             'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', 3),
  ('KR_JEJU', '흑돼지 거리',           '맛집',   '제주 대표 먹거리, 통통한 흑돼지 구이',        'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=300&fit=crop', 1),
  ('KR_JEJU', '우도 해녀 국수',        '맛집',   '우도 현지 해녀가 만드는 전복 국수',           'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400&h=300&fit=crop', 2);

-- 속초/강릉 (KR_SOKCHO)
INSERT INTO "Place" ("destinationId", name, category, description, "imageUrl", rank) VALUES
  ('KR_SOKCHO', '속초 해수욕장',       '관광지', '설악산을 배경으로 한 아름다운 동해 해변',     'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', 1),
  ('KR_SOKCHO', '설악산 국립공원',     '관광지', '웅장한 암봉과 단풍으로 유명한 명산',          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',   2),
  ('KR_SOKCHO', '경포대 해변',         '관광지', '강릉의 대표 해변, 드넓은 백사장',             'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', 3),
  ('KR_SOKCHO', '속초 중앙시장 닭강정','맛집',   '속초 여행의 필수 코스, 바삭달콤 닭강정',      'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=300&fit=crop', 1),
  ('KR_SOKCHO', '강릉 초당순두부',     '맛집',   '바닷물로 만든 부드러운 강릉 초당순두부',      'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400&h=300&fit=crop', 2);

-- 서울 (KR_SEOUL)
INSERT INTO "Place" ("destinationId", name, category, description, "imageUrl", rank) VALUES
  ('KR_SEOUL', '경복궁',               '관광지', '조선 시대 대표 궁궐, 수문장 교대식',          'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=400&h=300&fit=crop', 1),
  ('KR_SEOUL', '북촌 한옥마을',        '관광지', '서울 도심 속 전통 한옥과 골목길',             'https://images.unsplash.com/photo-1583400701775-49f0e0dcfe3d?w=400&h=300&fit=crop', 2),
  ('KR_SEOUL', '성수동 카페거리',      '관광지', '힙한 감성의 팝업스토어와 카페 성지',          'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&h=300&fit=crop', 3),
  ('KR_SEOUL', '광장시장',             '맛집',   '빈대떡, 마약김밥, 육회 비빔밥의 성지',        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',   1),
  ('KR_SEOUL', '을지로 노포',          '맛집',   '레트로 감성 골목의 오래된 맛집 탐방',         'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=300&fit=crop', 2);

-- 부산 (KR_BUSAN)
INSERT INTO "Place" ("destinationId", name, category, description, "imageUrl", rank) VALUES
  ('KR_BUSAN', '해운대 해수욕장',      '관광지', '한국 최고의 해변, 마린시티 스카이라인',       'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', 1),
  ('KR_BUSAN', '감천문화마을',         '관광지', '색색의 집들이 층층이 쌓인 부산의 마추픽추',   'https://images.unsplash.com/photo-1583400701775-49f0e0dcfe3d?w=400&h=300&fit=crop', 2),
  ('KR_BUSAN', '광안리 해수욕장',      '관광지', '광안대교를 배경으로 한 야경 명소',            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', 3),
  ('KR_BUSAN', '자갈치 시장',          '맛집',   '싱싱한 활어회와 해산물의 천국',               'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',   1),
  ('KR_BUSAN', '밀면 골목',            '맛집',   '부산 토박이 소울푸드, 시원한 부산 밀면',      'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400&h=300&fit=crop', 2);