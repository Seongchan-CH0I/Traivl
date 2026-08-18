import os
import sys

# 프로젝트 경로 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.gcs_service import gcs_service

def run_test():
    print("🚀 [GCS 연동 검증 테스트 시작]")
    
    # 1. 파일 업로드 테스트
    test_content = "Hello, GCS Cloud Integration Test!"
    local_test_file = "gcs_test_sample.txt"
    with open(local_test_file, "w", encoding="utf-8") as f:
        f.write(test_content)
        
    print(f"1. 로컬 샘플 파일 생성: {local_test_file}")
    upload_success = gcs_service.upload_file(local_test_file, "tests/gcs_test_sample.txt")
    
    if upload_success:
        print("✅ 1단계: GCS 버킷 파일 업로드 성공!")
    else:
        print("❌ 1단계: GCS 업로드 실패 (인증 키 또는 버킷 권한 확인 필요)")
        return

    # 2. 동적 다운로드 테스트 (핫스와핑 온디맨드 마운트 검증)
    download_target = "data/downloaded_sample.txt"
    if os.path.exists(download_target):
        os.remove(download_target)
        
    download_success = gcs_service.download_file("tests/gcs_test_sample.txt", download_target)
    if download_success and os.path.exists(download_target):
        with open(download_target, "r", encoding="utf-8") as f:
            read_data = f.read()
        print(f"✅ 2단계: GCS 동적 다운로드 성공! (내용: '{read_data}')")
    else:
        print("❌ 2단계: GCS 다운로드 실패")

    # 임시 파일 정리
    if os.path.exists(local_test_file): os.remove(local_test_file)
    if os.path.exists(download_target): os.remove(download_target)
    
    print("🎉 [GCS 연동 최종 검증 완료: 백엔드 클라우드 스토리지 준비 완료!]")

if __name__ == "__main__":
    run_test()
