import os
from google.cloud import storage
from app.core.config import settings

class GCSService:
    def __init__(self):
        # GCP 인증 키가 존재하는지 확인 후 클라이언트 초기화
        key_path = getattr(settings, 'GCP_KEY_PATH', 'gcp-key.json')
        bucket_name = getattr(settings, 'GCS_BUCKET_NAME', 'traivl-map-data-bucket')
        
        # 상대 경로를 프로젝트 루트 경로 기준으로 보정
        if not os.path.isabs(key_path):
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            key_path = os.path.join(base_dir, key_path)

        if os.path.exists(key_path):
            try:
                self.client = storage.Client.from_service_account_json(key_path)
                self.bucket_name = bucket_name
                print(f"✅ [GCS] 구글 클라우드 스토리지 연결 완료 (버킷: {self.bucket_name})")
            except Exception as e:
                self.client = None
                print(f"⚠️ [GCS] 인증 키 파일 로드 실패: {e}")
        else:
            self.client = None
            print(f"⚠️ [GCS] 서비스 계정 키 파일({key_path})을 찾을 수 없습니다. (키 발급 필요)")

    def upload_file(self, local_path: str, gcs_path: str) -> bool:
        """로컬 파일을 GCS 버킷으로 업로드"""
        if not self.client:
            print("❌ GCS 클라이언트가 초기화되지 않았습니다.")
            return False
        try:
            bucket = self.client.bucket(self.bucket_name)
            blob = bucket.blob(gcs_path)
            blob.upload_from_filename(local_path)
            print(f"☁️ [GCS 업로드 성공] {local_path} -> gcs://{self.bucket_name}/{gcs_path}")
            return True
        except Exception as e:
            print(f"❌ [GCS 업로드 실패] {e}")
            return False

    def download_file(self, gcs_path: str, local_path: str) -> bool:
        """GCS 버킷의 지도/데이터 파일을 로컬로 동적 다운로드 (핫스와핑 온디맨드)"""
        if not self.client:
            print("❌ GCS 클라이언트가 초기화되지 않았습니다.")
            return False
        try:
            # 이미 로컬 캐시에 존재하면 다운로드 생략
            if os.path.exists(local_path):
                print(f"⚡ [로컬 캐시 사용] 파일이 이미 로컬에 존재합니다: {local_path}")
                return True

            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            bucket = self.client.bucket(self.bucket_name)
            blob = bucket.blob(gcs_path)
            blob.download_to_filename(local_path)
            print(f"⬇️ [GCS 동적 다운로드 성공] gcs://{self.bucket_name}/{gcs_path} -> {local_path}")
            return True
        except Exception as e:
            print(f"❌ [GCS 다운로드 실패] {e}")
            return False

# 싱글톤 인스턴스 생성
gcs_service = GCSService()
