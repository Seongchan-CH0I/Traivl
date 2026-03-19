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

-- 교토 (JP_KYOTO) 연관있는 이미지 변경완료
INSERT INTO "Place" ("destinationId", name, category, description, "imageUrl", rank) VALUES
  ('JP_KYOTO', '후시미 이나리 신사',   '관광지', '수천 개의 붉은 도리이가 이어진 신비로운 산길', 'https://ak-d.tripcdn.com/images/1mi2d224x8vmajmqk8706_W_640_0_R5_Q80.jpg?proc=source/trip', 1),
  ('JP_KYOTO', '기요미즈데라',         '관광지', '교토 동산 중턱의 웅장한 목조 사원',           'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Kyoto-Kiyomizudera%2C_Japan.jpg/500px-Kyoto-Kiyomizudera%2C_Japan.jpg', 2),
  ('JP_KYOTO', '아라시야마 대나무숲',  '관광지', '하늘을 가득 채운 대나무 터널',                'https://rimage.gnst.jp/livejapan.com/public/article/detail/a/20/00/a2000532/img/basic/a2000532_main.jpg?20241004000000&q=80', 3),
  ('JP_KYOTO', '긴카쿠지 (은각사)',    '관광지', '고요한 정원과 은빛 누각의 조화',              'https://rimage.gnst.jp/livejapan.com/public/article/detail/a/20/00/a2000150/img/ko/a2000150_parts_5d1b264db855b.jpg?20210203082417&q=80', 4),
  ('JP_KYOTO', '혼케 오와리야',        '맛집',   '500년 전통의 소바 전문점',                    'https://digjapan.travel/files/topics/7824_ext_02_0.jpg',  1),
  ('JP_KYOTO', '교토 카츠쿠라',        '맛집',   '바삭한 정통 돈카츠와 특제 소스',              'https://postfiles.pstatic.net/MjAyMzAxMTlfMjQ2/MDAxNjc0MTI0MjU5ODQ5.EWX2HrQuJK1x38NvZmWXpN9bW9tAdM0GGz1rZpXji0Eg.agpkJSQFKWIEd5qgDT1CFxBPt32B_eO_grOSn0YOt-Mg.JPEG.mortareg/%EF%BB%BF%EA%B5%90%ED%86%A0%EC%97%AD_%EB%A7%9B%EC%A7%91_%EC%B9%B4%EC%B8%A0%EC%BF%A0%EB%9D%BC_%EB%8F%88%EA%B9%8C%EC%8A%A4_%EC%A7%84%EC%8B%AC_%EB%A7%9B%EB%82%98%EC%9A%94_(19).JPG?type=w3840', 2);

-- 오사카 (JP_OSAKA) 연관있는 이미지 변경완료
INSERT INTO "Place" ("destinationId", name, category, description, "imageUrl", rank) VALUES
  ('JP_OSAKA', '도톤보리',             '관광지', '오사카의 심장, 화려한 네온사인과 먹거리의 거리', 'https://cdn.tripstore.kr/IMAGE/debb49d9e85913fa67148df87db5dd5d.png?q=85&w=1440', 1),
  ('JP_OSAKA', '오사카성',             '관광지', '일본 3대 명성 중 하나, 웅장한 역사 유적',       'https://att-japan.net/wp-content/uploads/2025/04/pixta_98367090_M_R.webp', 2),
  ('JP_OSAKA', '신세카이',             '관광지', '쿠시카츠와 레트로 감성이 넘치는 골목',          'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Shinsekai_and_Tsutenkaku_at_night_2019-04-12.jpg/500px-Shinsekai_and_Tsutenkaku_at_night_2019-04-12.jpg', 3),
  ('JP_OSAKA', '스시 사카바 사스시',    '맛집',   '참치 해체 쇼와 참치 삼종 세트가 유명한 웨이팅 맛집.', 'https://ak-d.tripcdn.com/images/1mi5z224x8wf0j0yt084C_W_640_0_R5_Q80.jpg?proc=source/trip', 1),
  ('JP_OSAKA', '쿠로몬 시장',          '맛집',   '오사카의 부엌, 신선한 해산물과 먹거리 천국',    'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/19/e0/90/c2/kuromon-market.jpg?w=1400&h=-1&s=1',   2);

-- 도쿄 (JP_TOKYO) 연관있는 이미지 변경완료
INSERT INTO "Place" ("destinationId", name, category, description, "imageUrl", rank) VALUES
  ('JP_TOKYO', '시부야 스크램블 교차로', '관광지', '세계에서 가장 바쁜 횡단보도',                'https://rimage.gnst.jp/livejapan.com/public/article/detail/a/00/02/a0002128/img/ko/a0002128_parts_5b3c60d00e62e.jpg?20190904105354&q=80', 1),
  ('JP_TOKYO', '아사쿠사 & 센소지',     '관광지', '도쿄 최고(最古)의 사원과 나카미세 쇼핑거리', 'https://s3-ap-northeast-1.amazonaws.com/thegate/2021/03/22/20/51/08/Sensouji-temple.jpg', 2),
  ('JP_TOKYO', '하라주쿠 다케시타 거리','관광지', '팝컬처와 패션의 성지',                       'https://media.triple.guide/triple-cms/c_limit,f_auto,h_2048,w_2048/f98cc29a-44e9-4ffb-b404-45a917da864d.jpeg', 3),
  ('JP_TOKYO', '스키야바시 지로',       '맛집',   '미슐랭 3스타 전설의 스시 오마카세',           'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfkqpe9pmavUWAraA7-OfeiabvqQvRst0O0A&s', 1),
  ('JP_TOKYO', '이치란 신주쿠점',       '맛집',   '도쿄 한복판에서 즐기는 혼자만의 라멘',        'https://media.triple.guide/triple-cms/c_limit,f_auto,h_1024,w_1024/faf2454d-17da-430d-9af4-ffce9b2b14f2.jpeg', 2);

-- 오키나와 (JP_OKINAWA) 연관있는 이미지 변경완료
INSERT INTO "Place" ("destinationId", name, category, description, "imageUrl", rank) VALUES
  ('JP_OKINAWA', '에메랄드 비치',      '관광지', '새하얀 모래와 에메랄드빛 투명한 바다',        'https://media.triple.guide/triple-cms/c_limit,f_auto,h_1024,w_1024/551ed156-92ce-4c19-9684-7506f69fe181.jpeg', 1),
  ('JP_OKINAWA', '슈리성',             '관광지', '류큐 왕국의 역사를 담은 붉은 성',             'https://ohh.okinawa/wpdir/wp-content/uploads/2018/10/369082b2c00f18627d52e7fe9ef8d055.jpg', 2),
  ('JP_OKINAWA', '추라우미 수족관',    '관광지', '세계 최대급 수족관, 고래상어와 만남',         'https://ak-d.tripcdn.com/images/0101f12000jocw73w0BD4_C_1200_800_Q70.webp?proc=source%2ftrip',   3),
  ('JP_OKINAWA', '마키시 공설시장',    '맛집',   '오키나와 현지인들의 부엌, 신선한 해산물',     'https://enjoyokinawa.cerulean-blue.co.jp/wp-content/uploads/2023/12/IMG_7845-2-780x527.jpg',   1),
  ('JP_OKINAWA', '하마베노차야',       '맛집',   '오션뷰 카페, 오키나와 전통 빙수 젠자이',      'https://img.siksinhot.com/place/1474730280124948.jpg?w=640&h=840&c=Y', 2);

-- 제주도 (KR_JEJU) 연관있는 이미지 변경완료
INSERT INTO "Place" ("destinationId", name, category, description, "imageUrl", rank) VALUES
  ('KR_JEJU', '성산일출봉',            '관광지', '유네스코 세계자연유산, 일출 명소',            'https://t1.daumcdn.net/cfile/tistory/99E3E54C5D4A36B618', 1),
  ('KR_JEJU', '한라산',                '관광지', '남한 최고봉, 다채로운 등산 코스',             'https://img.khan.co.kr/news/2014/07/11/l_2014071201001050400139742.webp',   2),
  ('KR_JEJU', '협재 해수욕장',         '관광지', '에메랄드빛 바다와 하얀 모래사장',             'https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=b75e4d87-56e3-4ab5-8603-21d204c60bbc', 3),
  ('KR_JEJU', '흑돼지 거리',           '맛집',   '제주 대표 먹거리, 통통한 흑돼지 구이',        'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/d3/c3/92/ok-to-try-once.jpg?w=1200&h=-1&s=1', 1),
  ('KR_JEJU', '우도 해녀 국수',        '맛집',   '우도 현지 해녀가 만드는 전복 칼국수',           'https://d12zq4w4guyljn.cloudfront.net/20240722124243752_photo_437d43c0b222.webp', 2);

-- 속초/강릉 (KR_SOKCHO) 연관있는 이미지 변경완료
INSERT INTO "Place" ("destinationId", name, category, description, "imageUrl", rank) VALUES
  ('KR_SOKCHO', '속초 해수욕장',       '관광지', '설악산을 배경으로 한 아름다운 동해 해변',     'https://www.gangwon.to/upload/board/BDMAIN03/thumb/997b0db6-1ba2-49ff-8eee-486983d739cf.jpg', 1),
  ('KR_SOKCHO', '설악산 국립공원',     '관광지', '웅장한 암봉과 단풍으로 유명한 명산',          'https://gangwon.to/upload/board/BDMAIN03/973b8dcb-5182-4321-9cc1-20df7dfbedb9.jpg',   2),
  ('KR_SOKCHO', '경포대 해변',         '관광지', '강릉의 대표 해변, 드넓은 백사장',             'https://www.gangwon.to/upload/board/BDMAIN03/thumb/7ed4763c-8aa8-42d1-8c97-7aec334123e4.jpg', 3),
  ('KR_SOKCHO', '속초 중앙시장 닭강정','맛집',   '속초 여행의 필수 코스, 바삭달콤 닭강정',      'https://d12zq4w4guyljn.cloudfront.net/300_300_20260108121553_photo1_hkRAhLEW5gil.webp', 1),
  ('KR_SOKCHO', '강릉 초당순두부',     '맛집',   '바닷물로 만든 부드러운 강릉 초당순두부',      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd6Fo8hO056rNmL83eAbrybM8APq001_t7GQ&s', 2);

-- 서울 (KR_SEOUL) 연관있는 이미지 변경완료
INSERT INTO "Place" ("destinationId", name, category, description, "imageUrl", rank) VALUES
  ('KR_SEOUL', '경복궁',               '관광지', '조선 시대 대표 궁궐, 수문장 교대식',          'https://t3.ftcdn.net/jpg/00/70/61/92/360_F_70619287_SyI16wlrMbXWlP2jnJUAp0c6s6cJHilZ.jpg', 1),
  ('KR_SEOUL', '북촌 한옥마을',        '관광지', '서울 도심 속 전통 한옥과 골목길',             'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=400&h=300&fit=crop', 2),
  ('KR_SEOUL', '성수동 카페거리',      '관광지', '힙한 감성의 팝업스토어와 카페 성지',          'https://access.visitkorea.or.kr/bfvk_img/call?cmd=VIEW&id=e8b56b19-dafc-4e58-bbe1-967b027c820c&', 3),
  ('KR_SEOUL', '광장시장',             '맛집',   '빈대떡, 마약김밥, 육회 비빔밥의 성지',        'https://www.travelnbike.com/news/photo/201709/45545_47509_5844.jpg',   1),
  ('KR_SEOUL', '을지로 노포',          '맛집',   '레트로 감성 골목의 오래된 맛집 탐방',         'https://mblogthumb-phinf.pstatic.net/MjAyMTAzMTdfNTUg/MDAxNjE1OTM3NTYyNDA4.q9XslyF7jKUHI6QbbhHqbBqk19Ox3GNAQoT9hxbqOkAg.fRlvymC8y7o-4LgTKKPUHR4zymM4da2dnHPtRveiD8Mg.JPEG.ichufs/DSC_3894.jpg?type=w800', 2);

-- 부산 (KR_BUSAN) 연관있는 이미지 변경완료
INSERT INTO "Place" ("destinationId", name, category, description, "imageUrl", rank) VALUES
  ('KR_BUSAN', '해운대 해수욕장',      '관광지', '한국 최고의 해변, 마린시티 스카이라인',       'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQy62AjXQfqqkHuJf4sZyg2TVS3_2-YLYOYJg&s', 1),
  ('KR_BUSAN', '감천문화마을',         '관광지', '색색의 집들이 층층이 쌓인 부산의 마추픽추',   'https://www.telltrip.com/wp-content/uploads/2025/05/Gamcheon-Culture-Village2.jpg', 2),
  ('KR_BUSAN', '광안리 해수욕장',      '관광지', '광안대교를 배경으로 한 야경 명소',            'https://www.telltrip.com/wp-content/uploads/2024/12/2031_10966_5130.jpg', 3),
  ('KR_BUSAN', '자갈치 시장',          '맛집',   '싱싱한 활어회와 해산물의 천국',               'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNKv2mRL7va0vYuXLCSDRwlZtNa7p6u7fACA&s',   1),
  ('KR_BUSAN', '밀면 골목',            '맛집',   '부산 토박이 소울푸드, 시원한 부산 밀면',      'https://www.visitbusan.net/uploadImgs/files/cntnts/20250212142141957_oen', 2);
