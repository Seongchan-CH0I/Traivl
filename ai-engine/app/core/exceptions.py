# 서비스 계층에서 발생하는 도메인 예외 정의.
# 라우터가 원인별로 다른 HTTP 상태 코드를 내려주기 위해 종류를 구분한다.


class PlanError(Exception):
    """여행 코스 생성 과정에서 발생하는 예외의 공통 조상."""


class VectorSearchError(PlanError):
    """pgvector 검색 자체가 실패한 경우 (DB 접속 불가, 컬렉션 없음 등 인프라 장애)."""


class NoPlacesFoundError(PlanError):
    """검색은 성공했지만 해당 목적지에 적재된 장소가 없는 경우."""
