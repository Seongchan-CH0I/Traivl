-- 필요 시 pgvector 확장을 설치합니다 (ankane/pgvector 이미지는 기본적으로 내장되어 있습니다)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- 초기 테이블 스키마 작성 예시:
-- CREATE TABLE destinations (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     embedding vector(1536)
-- );
