const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5433/traivldb';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding mock shared schedules to database...');

    // 1. 기존 가상 테스트 유저 삭제 (안전하게)
    try {
        await prisma.schedule.deleteMany({
            where: {
                userId: { in: ['feed_user_1', 'feed_user_2'] }
            }
        });
        await prisma.user.deleteMany({
            where: {
                id: { in: ['feed_user_1', 'feed_user_2'] }
            }
        });
    } catch (e) {
        console.log('Clean up skipped or users did not exist.');
    }

    // 2. 가상 유저 1 생성
    const user1 = await prisma.user.create({
        data: {
            id: 'feed_user_1',
            email: 'doa@traivl.com',
            name: '김도아',
            dnaType: '컬처 트렌드세터',
            profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
        }
    });
    console.log(`Created user: ${user1.name}`);

    // 유저 1의 서울 일정 생성 및 공유
    const schedule1 = await prisma.schedule.create({
        data: {
            userId: user1.id,
            title: '도아의 서울 2박 3일 힙스터 투어',
            city: '서울',
            isShared: true,
            shareContent: '요즘 핫한 성수동과 전통적인 종로/북촌 감성을 가득 녹여낸 서울 힙스터 정복 코스입니다! 추천해요 ✨',
            itineraryData: {
                course_title: '도아의 서울 2박 3일 힙스터 투어',
                course_subtitle: '요즘 인스타 핫플과 레트로 골목의 만남',
                itinerary: [
                    {
                        day: 1,
                        places: [
                            { title: '경복궁', location: '한복 입고 수문장 교대식 관람', category: '관광지', suggested_time: '10:00' },
                            { title: '명동교자', location: '점심으로 진한 국물의 칼국수와 만두 한 그릇', category: '맛집', suggested_time: '12:30' },
                            { title: '북촌 한옥마을', location: '고즈넉한 골목 산책 및 한옥 갤러리 투어', category: '관광지', suggested_time: '14:30' },
                            { title: '을지로 노포 거리', location: '저녁에는 힙한 감성의 을지로 포차 야외 테이블에서 맥주 한잔', category: '맛집', suggested_time: '18:00' }
                        ]
                    },
                    {
                        day: 2,
                        places: [
                            { title: '창덕궁 비원', location: '예약 필수! 아름다운 왕실 정원 숲길 걷기', category: '관광지', suggested_time: '10:00' },
                            { title: '광장시장', location: '녹두빈대떡과 마약김밥, 육회로 즐기는 풍성한 전통 시장 먹거리', category: '맛집', suggested_time: '12:30' },
                            { title: '남산서울타워', location: '케이블카 탑승 후 해질녘 서울 360도 야경 즐기기', category: '관광지', suggested_time: '16:00' }
                        ]
                    }
                ]
            }
        }
    });
    console.log(`Created schedule: ${schedule1.title}`);

    // 3. 가상 유저 2 생성
    const user2 = await prisma.user.create({
        data: {
            id: 'feed_user_2',
            email: 'minjae@traivl.com',
            name: '이민재',
            dnaType: '본투비 푸드파이터',
            profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
        }
    });
    console.log(`Created user: ${user2.name}`);

    // 유저 2의 오사카 일정 생성 및 공유
    const schedule2 = await prisma.schedule.create({
        data: {
            userId: user2.id,
            title: '민재의 오사카 2박 3일 먹방 코스',
            city: '오사카',
            isShared: true,
            shareContent: '아침부터 밤까지 쉬지 않는 식도락의 도시 오사카! 검증된 맛집과 간식을 담았습니다. 배고플 틈이 없는 여행 🍜',
            itineraryData: {
                course_title: '민재의 오사카 2박 3일 먹방 코스',
                course_subtitle: '위장이 모자란 오사카 현지 맛집 폭격',
                itinerary: [
                    {
                        day: 1,
                        places: [
                            { title: '쿠로몬 시장', location: '해산물 꼬치구이와 신선한 와규 초밥 길거리 시식', category: '맛집', suggested_time: '11:00' },
                            { title: '치보 오코노미야키', location: '도톤보리 강변에서 먹는 두툼한 해물 오코노미야키', category: '맛집', suggested_time: '13:30' },
                            { title: '도톤보리 네온사인', location: '글리코상 앞에서 만세 포즈로 인증샷 찍기', category: '관광지', suggested_time: '16:00' },
                            { title: '하나마루켄 라멘', location: '부드러운 연골 차슈가 올라간 돈코츠 라멘과 시원한 맥주', category: '맛집', suggested_time: '19:00' }
                        ]
                    },
                    {
                        day: 2,
                        places: [
                            { title: '오사카성', location: '천수각에 올라가 전경 관람 및 말차 아이스크림 맛보기', category: '관광지', suggested_time: '10:00' },
                            { title: '모토무라 규카츠', location: '개인 화로에 직접 구워 입에서 살살 녹는 규카츠 정식', category: '맛집', suggested_time: '12:30' },
                            { title: '우메다 공중정원', location: '초고층 야외 루프탑 전망대에서 맞이하는 오사카 노을과 야경', category: '관광지', suggested_time: '17:30' }
                        ]
                    }
                ]
            }
        }
    });
    console.log(`Created schedule: ${schedule2.title}`);

    console.log('Seeding mock shared schedules successfully completed!');
}

main()
    .catch((e) => {
        console.error('Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
