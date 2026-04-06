import { PrismaClient } from '@prisma/client';

// lib/prisma.ts를 사용하는 대신 독립적으로 실행하기 위해 직접 설정
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 북촌 한옥마을 이미지 업데이트 시작...');

    // 1. 먼저 현재 상태 확인
    const currentPlace = await prisma.place.findFirst({
        where: {
            destinationId: 'KR_SEOUL',
            rank: 2,
            category: '관광지'
        }
    });

    if (!currentPlace) {
        console.error('❌ 업데이트할 대상을 찾을 수 없습니다 (서울, 2위, 관광지)');
        return;
    }

    console.log('📍 현재 데이터:', {
        name: currentPlace.name,
        imageUrl: currentPlace.imageUrl
    });

    // 2. 새로운 이미지 링크 (안정적인 Unsplash 링크)
    const NEW_IMAGE_URL = 'https://images.unsplash.com/photo-1582283120172-35921868470a?w=1200&q=80';
    const NEW_NAME = '북촌한옥마을';

    // 3. 업데이트 실행
    const updated = await prisma.place.update({
        where: { id: currentPlace.id },
        data: {
            imageUrl: NEW_IMAGE_URL,
            name: NEW_NAME
        }
    });

    console.log('✅ 업데이트 완료!');
    console.log('📍 변경된 데이터:', {
        name: updated.name,
        imageUrl: updated.imageUrl
    });
}

main()
    .catch((e) => {
        console.error('❌ 에러 발생:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
