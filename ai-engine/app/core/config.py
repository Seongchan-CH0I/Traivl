# 환경 변수 모아둔 곳 , .env 파일을 통해 API 키와 접속 정보 안전하게 관리하도록 설정
# 나중에 AWS 배포할때 편함
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Traivl AI Engine"
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://admin:password123@travel_db/travel_data")
    REDIS_HOST: str = os.getenv("REDIS_HOST", "travel_redis")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))

settings = Settings()
