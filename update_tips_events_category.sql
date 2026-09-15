-- [TRAIVL] 팁(rank 11)과 이벤트(rank 12) 카테고리 분리 업데이트 스크립트
-- 인기 장소(관광지)에 팁이나 이벤트가 노출되지 않도록 정확한 카테고리로 지정합니다.

UPDATE "Place" 
SET "category" = '팁' 
WHERE rank = 11;

UPDATE "Place" 
SET "category" = '이벤트' 
WHERE rank = 12;

-- 확인용 쿼리
-- SELECT id, "destinationId", name, category, rank FROM "Place" WHERE rank IN (11, 12);
