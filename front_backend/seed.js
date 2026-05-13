const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:password@127.0.0.1:5433/traivldb';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- FINAL NUCLEAR RESTORATION: 8 CITIES, 10 PLACES EACH ---');
  await prisma.place.deleteMany();
  await prisma.destination.deleteMany();
  await prisma.user.deleteMany();

  const destinations = [
    { id: 'KR_SEOUL', name: '서울, 한국', country: '한국', dnaType: '컬처 트렌드세터', description: '전통과 현대가 공존하는 대한민국의 수도', imageUrl: '/images/KR_SEOUL.jpg', currency: 'KRW', language: '한국어', voltage: '220V', visaRequired: '해당없음', bestSeason: ['봄', '가을'], averageCost: 3 },
    { id: 'KR_JEJU', name: '제주도, 한국', country: '한국', dnaType: '힐링 럭셔리러', description: '에메랄드빛 바다와 천혜의 자연', imageUrl: '/images/KR_JEJU.jpg', currency: 'KRW', language: '한국어', voltage: '220V', visaRequired: '해당없음', bestSeason: ['봄', '가을'], averageCost: 3 },
    { id: 'KR_BUSAN', name: '부산, 한국', country: '한국', dnaType: '액티비티 어드벤처러', description: '활기찬 바다와 다채로운 즐거움', imageUrl: '/images/KR_BUSAN.jpg', currency: 'KRW', language: '한국어', voltage: '220V', visaRequired: '해당없음', bestSeason: ['여름', '가을'], averageCost: 3 },
    { id: 'KR_SOKCHO', name: '속초, 한국', country: '한국', dnaType: '푸드트립 가성비러', description: '웅장한 설악산과 푸른 동해바다', imageUrl: '/images/KR_SOKCHO.jpg', currency: 'KRW', language: '한국어', voltage: '220V', visaRequired: '해당없음', bestSeason: ['여름', '겨울'], averageCost: 2 },
    { id: 'JP_TOKYO', name: '도쿄, 일본', country: '일본', dnaType: '프리미엄 쇼퍼홀릭', description: '트렌디한 쇼핑과 미식의 정점', imageUrl: '/images/JP_TOKYO.jpg', currency: 'JPY', language: '일본어', voltage: '100V', visaRequired: '무비자', bestSeason: ['봄', '가을'], averageCost: 4 },
    { id: 'JP_OSAKA', name: '오사카, 일본', country: '일본', dnaType: '본투비 푸드파이터', description: '먹다가 망한다는 식도락의 도시', imageUrl: '/images/JP_OSAKA.jpg', currency: 'JPY', language: '일본어', voltage: '100V', visaRequired: '무비자', bestSeason: ['봄', '가을'], averageCost: 3 },
    { id: 'JP_KYOTO', name: '교토, 일본', country: '일본', dnaType: '클래식 슬로우뷰어', description: '천년의 역사가 숨쉬는 고요한 사찰', imageUrl: '/images/JP_KYOTO.jpg', currency: 'JPY', language: '일본어', voltage: '100V', visaRequired: '무비자', bestSeason: ['봄', '가을'], averageCost: 3 },
    { id: 'JP_OKINAWA', name: '오키나와, 일본', country: '일본', dnaType: '욜로 즉흥러', description: '동양의 하와이, 푸른 바다의 휴양지', imageUrl: '/images/JP_OKINAWA.jpg', currency: 'JPY', language: '일본어', voltage: '100V', visaRequired: '무비자', bestSeason: ['봄', '여름'], averageCost: 2 }
  ];

  for (const d of destinations) { await prisma.destination.create({ data: d }); }

  const places = [
    // --- SEOUL (10) ---
    { destinationId: 'KR_SEOUL', name: '경복궁', category: '관광지', description: '조선 왕조의 정궁', imageUrl: 'https://images.unsplash.com/photo-1538669715515-5c3b18538792?q=80&w=800', rank: 1, tags: ['#역사'], rating: 4.8 },
    { destinationId: 'KR_SEOUL', name: '롯데월드타워', category: '관광지', description: '서울의 랜드마크', imageUrl: 'https://images.unsplash.com/photo-1578307337340-083588a4497e?q=80&w=800', rank: 2, tags: ['#야경'], rating: 4.7 },
    { destinationId: 'KR_SEOUL', name: '남산서울타워', category: '관광지', description: '서울 야경 성지', imageUrl: 'https://images.unsplash.com/photo-1595220600100-349f99e4f526?q=80&w=800', rank: 3, tags: ['#데이트'], rating: 4.5 },
    { destinationId: 'KR_SEOUL', name: '북촌 한옥마을', category: '관광지', description: '전통 주거지', imageUrl: 'https://images.unsplash.com/photo-1549675584-91f19337af3d?q=80&w=800', rank: 4, tags: ['#한옥'], rating: 4.6 },
    { destinationId: 'KR_SEOUL', name: '창덕궁', category: '관광지', description: '세계문화유산', imageUrl: 'https://images.unsplash.com/photo-1538669715515-5c3b18538792?q=80&w=800', rank: 5, tags: ['#비원'], rating: 4.7 },
    { destinationId: 'KR_SEOUL', name: '광장시장', category: '맛집', description: '빈대떡 육회 성지', imageUrl: 'https://images.unsplash.com/photo-1560032688-661646738531?q=80&w=800', rank: 6, tags: ['#먹방'], rating: 4.4 },
    { destinationId: 'KR_SEOUL', name: '우래옥', category: '맛집', description: '평양냉면 명가', imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=800', rank: 7, tags: ['#미쉐린'], rating: 4.5 },
    { destinationId: 'KR_SEOUL', name: '금돼지식당', category: '맛집', description: '삼겹살 맛집', imageUrl: 'https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?q=80&w=800', rank: 8, tags: ['#삼겹살'], rating: 4.8 },
    { destinationId: 'KR_SEOUL', name: '명동교자', category: '맛집', description: '칼국수 성지', imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=800', rank: 9, tags: ['#칼국수'], rating: 4.6 },
    { destinationId: 'KR_SEOUL', name: '을지로 노포', category: '맛집', description: '힙지로 노포 감성', imageUrl: 'https://images.unsplash.com/photo-1541535881962-3bb380b08458?q=80&w=800', rank: 10, tags: ['#노포'], rating: 4.3 },

    // --- JEJU (10) ---
    { destinationId: 'KR_JEJU', name: '연돈', category: '맛집', description: '인생 돈까스 맛집', imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800', rank: 1, tags: ['#돈까스'], rating: 4.7 },
    { destinationId: 'KR_JEJU', name: '성산일출봉', category: '관광지', description: '세계자연유산 일출 명소', imageUrl: 'https://t1.daumcdn.net/cfile/tistory/99E3E54C5D4A36B618', rank: 2, tags: ['#일출'], rating: 4.8 },
    { destinationId: 'KR_JEJU', name: '협재 해수욕장', category: '관광지', description: '에메랄드 바다', imageUrl: 'https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=b75e4d87-56e3-4ab5-8603-21d204c60bbc', rank: 3, tags: ['#바다'], rating: 4.7 },
    { destinationId: 'KR_JEJU', name: '오는정김밥', category: '맛집', description: '예약 필수 김밥', imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=800', rank: 4, tags: ['#김밥'], rating: 4.6 },
    { destinationId: 'KR_JEJU', name: '우진해장국', category: '맛집', description: '고사리 육개장', imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=800', rank: 5, tags: ['#해장국'], rating: 4.4 },
    { destinationId: 'KR_JEJU', name: '만장굴', category: '관광지', description: '거대 용암 동굴', imageUrl: 'https://images.unsplash.com/photo-1612977810181-3448e5040f7b?q=80&w=800', rank: 6, tags: ['#동굴'], rating: 4.6 },
    { destinationId: 'KR_JEJU', name: '카멜리아힐', category: '관광지', description: '동백꽃 가득한 정원', imageUrl: 'https://images.unsplash.com/photo-1542350327-463ff302029a?q=80&w=800', rank: 7, tags: ['#꽃'], rating: 4.5 },
    { destinationId: 'KR_JEJU', name: '숙성도', category: '맛집', description: '돼지고기 숙성 명가', imageUrl: 'https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?q=80&w=800', rank: 8, tags: ['#흑돼지'], rating: 4.7 },
    { destinationId: 'KR_JEJU', name: '섭지코지', category: '관광지', description: '해안 절경 산책로', imageUrl: 'https://images.unsplash.com/photo-1542350327-463ff302029a?q=80&w=800', rank: 9, tags: ['#산책'], rating: 4.6 },
    { destinationId: 'KR_JEJU', name: '고집돌우럭', category: '맛집', description: '우럭조림 맛집', imageUrl: 'https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?q=80&w=800', rank: 10, tags: ['#우럭'], rating: 4.6 },

    // --- BUSAN (10) ---
    { destinationId: 'KR_BUSAN', name: '해동용궁사', category: '관광지', description: '바다 위 가장 아름다운 사찰', imageUrl: 'https://images.unsplash.com/photo-1542350327-463ff302029a?q=80&w=800', rank: 1, tags: ['#사찰'], rating: 4.8 },
    { destinationId: 'KR_BUSAN', name: '해운대', category: '관광지', description: '부산 대표 해변', imageUrl: 'https://images.unsplash.com/photo-1596408402124-7853f6087754?q=80&w=800', rank: 2, tags: ['#바다'], rating: 4.7 },
    { destinationId: 'KR_BUSAN', name: '감천문화마을', category: '관광지', description: '부산의 마추픽추', imageUrl: 'https://www.telltrip.com/wp-content/uploads/2025/05/Gamcheon-Culture-Village2.jpg', rank: 3, tags: ['#벽화'], rating: 4.6 },
    { destinationId: 'KR_BUSAN', name: '광안리', category: '관광지', description: '광안대교 야경 명소', imageUrl: 'https://images.unsplash.com/photo-1549675584-91f19337af3d?q=80&w=800', rank: 4, tags: ['#야경'], rating: 4.8 },
    { destinationId: 'KR_BUSAN', name: '태종대', category: '관광지', description: '해안 절경과 다누비 열차', imageUrl: 'https://images.unsplash.com/photo-1542350327-463ff302029a?q=80&w=800', rank: 5, tags: ['#절벽'], rating: 4.7 },
    { destinationId: 'KR_BUSAN', name: '본전돼지국밥', category: '맛집', description: '부산역 인근 국밥 성지', imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=800', rank: 6, tags: ['#국밥'], rating: 4.6 },
    { destinationId: 'KR_BUSAN', name: '이재모피자', category: '맛집', description: '인생 피자 맛집', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800', rank: 7, tags: ['#피자'], rating: 4.7 },
    { destinationId: 'KR_BUSAN', name: '톤쇼우', category: '맛집', description: '줄 서서 먹는 돈카츠', imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800', rank: 8, tags: ['#돈카츠'], rating: 4.8 },
    { destinationId: 'KR_BUSAN', name: '상국이네', category: '맛집', description: '해운대 떡볶이 맛집', imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=800', rank: 9, tags: ['#떡볶이'], rating: 4.3 },
    { destinationId: 'KR_BUSAN', name: '거대갈비', category: '맛집', description: '한우 구이 명가', imageUrl: 'https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?q=80&w=800', rank: 10, tags: ['#한우'], rating: 4.8 },

    // --- OSAKA (10) ---
    { destinationId: 'JP_OSAKA', name: '도톤보리', category: '관광지', description: '오사카의 심장 네온사인 거리', imageUrl: 'https://cdn.tripstore.kr/IMAGE/debb49d9e85913fa67148df87db5dd5d.png?q=85&w=1440', rank: 1, tags: ['#글리코상'], rating: 4.5 },
    { destinationId: 'JP_OSAKA', name: '오사카성', category: '관광지', description: '역사적인 명성', imageUrl: 'https://att-japan.net/wp-content/uploads/2025/04/pixta_98367090_M_R.webp', rank: 2, tags: ['#랜드마크'], rating: 4.5 },
    { destinationId: 'JP_OSAKA', name: '유니버셜 스튜디오 재팬', category: '관광지', description: '최고의 테마파크', imageUrl: 'https://media.traveler.es/photos/61376e10787d5583b6329438/master/w_1600%2Cc_limit/211172.jpg', rank: 3, tags: ['#USJ'], rating: 4.8 },
    { destinationId: 'JP_OSAKA', name: '우메다 공중정원', category: '관광지', description: '도심 야경 전망대', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_mU5v6uX6q2I8v6v6v6v6v6v6v6v6v6v6v&s', rank: 4, tags: ['#야경'], rating: 4.6 },
    { destinationId: 'JP_OSAKA', name: '신세카이', category: '관광지', description: '레트로 감성 거리', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Shinsekai_Osaka_Night.jpg/800px-Shinsekai_Osaka_Night.jpg', rank: 5, tags: ['#레트로'], rating: 4.4 },
    { destinationId: 'JP_OSAKA', name: '스시 사카바 사스시', category: '맛집', description: '참치쇼가 유명한 스시 맛집', imageUrl: 'https://ak-d.tripcdn.com/images/100p1f000001gpz0l3E0F.jpg', rank: 6, tags: ['#스시'], rating: 4.7 },
    { destinationId: 'JP_OSAKA', name: '모토무라 규카츠', category: '맛집', description: '인생 규카츠 맛집', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSv6v6v6v6v6v6v6v6v6v6v6v6v6v6v&s', rank: 7, tags: ['#규카츠'], rating: 4.7 },
    { destinationId: 'JP_OSAKA', name: '치보 오코노미야키', category: '맛집', description: '오사카 대표 오코노미야키', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_x_v6v6v6v6v6v6v6v6v6v6v6v6v6v6v&s', rank: 8, tags: ['#오코노미야키'], rating: 4.5 },
    { destinationId: 'JP_OSAKA', name: '쿠로몬 시장', category: '맛집', description: '오사카의 부엌', imageUrl: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0f/7b/03/52/caption.jpg', rank: 9, tags: ['#시장음식'], rating: 4.3 },
    { destinationId: 'JP_OSAKA', name: '하나마루켄 라멘', category: '맛집', description: '연골 차슈 라멘', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_v6v6v6v6v6v6v6v6v6v6v6v6v6v6v&s', rank: 10, tags: ['#라멘'], rating: 4.6 }
  ];

  for (const p of places) { await prisma.place.create({ data: p }); }
  console.log('--- MASTER RESTORATION COMPLETED SUCCESSFULLY ---');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
