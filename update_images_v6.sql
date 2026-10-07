-- [Traivl Image Permanent Asset Update V6]
-- 외부 링크 만료/오류 방지를 위해 로컬 정적 에셋 파일로 영구 변경
-- 실행 방법: 
-- node update_db_v6.js

UPDATE "Place" 
SET "imageUrl" = '/images/places/seoraksan.jpg' 
WHERE name = '설악산';

UPDATE "Place" 
SET "imageUrl" = '/images/places/louvre.webp' 
WHERE name = '루브르 박물관';

UPDATE "Place" 
SET "imageUrl" = '/images/places/kishimoto.jpg' 
WHERE name = '키시모토';

UPDATE "Place" 
SET "imageUrl" = '/images/places/cheongchosu.webp' 
WHERE name = '청초수물회';

UPDATE "Place" 
SET "imageUrl" = '/images/places/hanamaluken.jpg' 
WHERE name = '하나마루켄';

UPDATE "Place" 
SET "imageUrl" = '/images/places/uobei.jpg' 
WHERE name = '우오베이';

UPDATE "Place" 
SET "imageUrl" = '/images/places/bongpomuguri.jpg' 
WHERE name = '봉포머구리';
