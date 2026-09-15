-- 철학의 길 벚꽃 축제 이미지 로컬 정적 에셋으로 영구 반영
UPDATE "Place" 
SET "imageUrl" = '/images/tetsugakunomichi_spring_1.jpg' 
WHERE name = '철학의 길 벚꽃 축제' 
   OR "imageUrl" LIKE '%tetsugakunomichi_spring_1.jpg%';
