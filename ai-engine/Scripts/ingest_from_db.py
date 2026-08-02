import os
import sys
import psycopg2
from dotenv import load_dotenv

# 부모 폴더 모듈 읽기용
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores.pgvector import PGVector
from langchain_core.documents import Document

# 환경 변수 로드
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "../.env")
load_dotenv(dotenv_path=env_path)

MAPPING = {
    'KR_SEOUL': '서울',
    'KR_JEJU': '제주도',
    'KR_BUSAN': '부산',
    'KR_SOKCHO': '속초',
    'JP_TOKYO': '도쿄',
    'JP_OSAKA': '오사카',
    'JP_KYOTO': '교토',
    'JP_FUKUOKA': '후쿠오카',
    'JP_OKINAWA': '오키나와',
    'FR_PARIS': '파리',
    'ES_BARCELONA': '바르셀로나',
    'IT_ROME': '로마',
    'DE_BERLIN': '베를린'
}

def main():
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5433/traivldb")
    print(f"Connecting to database to fetch places... DB_URL: {db_url}")
    
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    # 1. Fetch destinations and their countries
    cursor.execute('SELECT id, country FROM "Destination"')
    destinations = cursor.fetchall()
    dest_to_country = {d[0]: d[1] for d in destinations}
    
    # 2. Fetch all places
    cursor.execute('SELECT id, "destinationId", name, category, description, latitude, longitude, tags FROM "Place"')
    places = cursor.fetchall()
    
    print(f"Fetched {len(places)} places from DB.")
    
    documents = []
    unique_ids = []
    
    for p in places:
        place_id, dest_id, name, category, description, lat, lng, tags = p
        
        # skip if destination is not in our mapping
        if dest_id not in MAPPING:
            print(f"Skipping place {name} with unknown destinationId {dest_id}")
            continue
            
        mapped_dest = MAPPING[dest_id]
        country = dest_to_country.get(dest_id, "알수없음")
        
        # page_content: {name} - {description} 카테고리: {', '.join(tags)}
        page_content = f"{name} - {description or ''} 카테고리: {', '.join(tags or [])}"
        
        doc = Document(
            page_content=page_content,
            metadata={
                "place_id": str(place_id),
                "name": name,
                "country": country,
                "destination": mapped_dest,
                "lat": float(lat) if lat is not None else 0.0,
                "lng": float(lng) if lng is not None else 0.0,
                "tags": tags or [],
                "duration_mins": 90,
                "category": category or '명소'
            }
        )
        documents.append(doc)
        unique_ids.append(str(place_id))
        
    cursor.close()
    conn.close()
    
    if not documents:
        print("No documents to index.")
        return
        
    print(f"Prepared {len(documents)} documents for pgvector indexing.")
    
    print("Initializing HuggingFaceEmbeddings model...")
    embeddings_model = HuggingFaceEmbeddings(model_name="jhgan/ko-sbert-nli")
    
    CONNECTION_STRING = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    COLLECTION_NAME = "travel_places"
    
    print("Writing embeddings to PGVector...")
    vector_db = PGVector.from_documents(
        embedding=embeddings_model,
        documents=documents,
        ids=unique_ids,
        collection_name=COLLECTION_NAME,
        connection_string=CONNECTION_STRING,
        pre_delete_collection=True
    )
    print("Successfully ingested places into PGVector vector database!")

if __name__ == "__main__":
    main()
