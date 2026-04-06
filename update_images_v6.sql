-- 북촌한옥마을 이미지 버그 수정 및 이름 표준화 (v6)
-- 123rf 미리보기 이미지를 안정적인 Unsplash 이미지로 교체합니다.

UPDATE "Place" 
SET 
    "imageUrl" = 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=800&q=80',
    "name" = '북촌 한옥마을' 
WHERE 
    "destinationId" = 'KR_SEOUL' 
    AND "rank" = 2
    AND "category" = '관광지';

-- 을지로 노포 복구 (혹시 위에서 잘못 업데이트된 경우)
UPDATE "Place" 
SET 
    "imageUrl" = 'https://mblogthumb-phinf.pstatic.net/MjAyMTAzMTdfNTUg/MDAxNjE1OTM3NTYyNDA4.q9XslyF7jKUHI6QbbhHqbBqk19Ox3GNAQoT9hxbqOkAg.fRlvymC8y7o-4LgTKKPUHR4zymM4da2dnHPtRveiD8Mg.JPEG.ichufs/DSC_3894.jpg?type=w800',
    "name" = '을지로 노포'
WHERE 
    "destinationId" = 'KR_SEOUL' 
    AND "rank" = 2
    AND "category" = '맛집';

-- 확인용 쿼리
-- SELECT * FROM "Place" WHERE name = '북촌한옥마을';
