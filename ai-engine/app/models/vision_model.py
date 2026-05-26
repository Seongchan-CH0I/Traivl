from pydantic import BaseModel, Field
from typing import List, Optional

# ==========================================
# 3. /vision/lens 관련 모델 (스마트 렌즈 프리미엄 스키마)
# ==========================================

class VisionLensRequest(BaseModel):
    user_location: Optional[str] = Field(default="unknown", description="사용자의 현재 위치 (예: '일본 오사카', '프랑스 파리')")
    extracted_text: Optional[str] = Field(None, description="사전에 추출된 텍스트 (text_only 모드 등에서 사용)")
    image_base64: Optional[str] = Field(None, description="Base64로 인코딩된 분석용 이미지 데이터")
    mode: str = Field(default="auto", description="분석 모드 ('auto', 'text_only', 'image_only')")

class IdentifiedItem(BaseModel):
    name: str = Field(description="원문 텍스트 또는 대상 명칭 (예: '豚骨ラーメン')")
    translated_name: str = Field(description="한국어 번역 명칭 (예: '돈코츠 라멘')")
    explanation: str = Field(description="해당 대상/텍스트에 대한 한국어 설명 (예: '진하게 우려낸 뽀얀 돼지 뼈 국물의 전통 일본식 라면')")
    cultural_context: Optional[str] = Field(None, description="개별 대상에 대한 현지 팁이나 추가 정보 (예: '보통 차슈와 아지타마고를 곁들여 먹습니다.')")

class VisionLensData(BaseModel):
    identified_type: str = Field(description="식별된 유형 (예: 'menu', 'sign', 'landmark', 'object', 'other')")
    main_subject: str = Field(description="이미지/상황을 요약하는 주 분석 대상 제목 (예: '일본 라멘 식당 메뉴판')")
    overview: str = Field(description="이미지 및 상황에 대한 전반적인 설명 요약")
    items: List[IdentifiedItem] = Field(default=[], description="이미지 내에서 발견된 개별 식별 항목 리스트")
    cultural_context: str = Field(description="현지 위치 정보와 연관된 전반적인 문화적 맥락, 팁 및 에티켓 가이드")

class VisionLensResponse(BaseModel):
    status: str = Field(description="응답 상태 ('success' 또는 'error')")
    data: VisionLensData = Field(description="스마트 렌즈 분석 결과 세부 데이터")

