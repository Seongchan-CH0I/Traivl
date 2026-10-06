-- [Traivl Image Permanent Asset Update V6]
-- 외부 링크 만료/오류 방지를 위해 로컬 정적 에셋 파일로 영구 변경
-- 실행 방법: 
-- docker exec -i traivl-postgres psql -U postgres -d traivldb < update_images_v6.sql

UPDATE "Place" 
SET "imageUrl" = '/images/places/seoraksan.jpg' 
WHERE name = '설악산';

UPDATE "Place" 
SET "imageUrl" = '/images/places/louvre.webp' 
WHERE name = '루브르 박물관';

UPDATE "Place" 
SET "imageUrl" = '/images/places/kishimoto.jpg' 
WHERE name = '키시모토';
