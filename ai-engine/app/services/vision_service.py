import base64
import re
from typing import Dict, Any, List, Tuple
from google import genai
from google.genai import types
from app.core.config import settings
from app.models.vision_model import VisionLensRequest, VisionLensData, IdentifiedItem

class VisionService:
    def __init__(self):
        # Google Gemini API 설정
        if settings.GOOGLE_API_KEY:
            self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)
            self.target_model = "gemini-flash-latest"
            print(f"✅ 비전 서비스: Gemini 1.5 Flash 준비 완료 (Target: {self.target_model})")
        else:
            self.client = None
            print("⚠️ 비전 서비스: GOOGLE_API_KEY가 없어 AI 비전 기능을 사용할 수 없습니다.")

    def _parse_base64_image(self, base64_str: str) -> Tuple[bytes, str]:
        """
        Base64 문자열에서 이미지 바이너리 데이터와 MIME 타입을 안전하게 추출하고 디코딩합니다.
        (data:image/png;base64,... 형식의 접두사 제거 대응)
        """
        mime_type = "image/jpeg"  # 기본값 설정
        
        # 정규식을 활용하여 데이터 URI 접두사 분리
        match = re.match(r"^data:(image/[a-zA-Z0-9+.-]+);base64,(.*)$", base64_str)
        if match:
            mime_type = match.group(1)
            raw_base64 = match.group(2)
        else:
            raw_base64 = base64_str
            
        # 화이트스페이스 제거 후 디코딩
        image_bytes = base64.b64decode(raw_base64.strip())
        return image_bytes, mime_type

    def _get_fallback_data(self, location: str, subject: str, error_msg: str) -> VisionLensData:
        """
        Gemini API 호출 실패 시 에러 전파를 막고 유연하게 반환할 Fallback 데이터를 생성합니다.
        """
        return VisionLensData(
            identified_type="other",
            main_subject=subject,
            overview=error_msg,
            items=[
                IdentifiedItem(
                    name="분석 실패",
                    translated_name="해석 불가",
                    explanation="서버 또는 API 연동 오류로 상세 분석 결과를 가져올 수 없었습니다.",
                    cultural_context=None
                )
            ],
            cultural_context=f"'{location}' 주변 정보 검색에 실패했습니다. 네트워크 상태나 API Key 설정을 확인해 주세요."
        )

    async def vision_lens(self, request: VisionLensRequest) -> VisionLensData:
        """
        스마트 렌즈 요청에 따라 번역 및 위치 기반 문화 팁 해설을 생성합니다.
        """
        if not self.client:
            return self._get_fallback_data(
                request.user_location, 
                "인증 오류", 
                "GOOGLE_API_KEY 환경 변수가 세팅되지 않아 AI 기능을 활성화할 수 없습니다."
            )

        # 1. 실행 모드 판별
        # auto 모드일 때 이미지가 넘어오면 이미지 분석으로 동작
        is_image_mode = request.mode == "image_only" or (request.mode == "auto" and request.image_base64)

        if is_image_mode:
            # ==========================================
            # [이미지 분석 모드 - Multimodal Analysis]
            # ==========================================
            if not request.image_base64:
                return self._get_fallback_data(
                    request.user_location, 
                    "입력 오류", 
                    "이미지 분석을 위한 Base64 문자열 데이터가 누락되었습니다."
                )

            try:
                # 이미지 디코딩
                image_bytes, mime_type = self._parse_base64_image(request.image_base64)
                
                # google-genai SDK 규격에 따라 바이너리 파트 객체 생성
                image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

                prompt = f"""
[역할]
당신은 여행 중인 한국인 사용자를 돕는 스마트 AI 비서이자 가이드입니다.
사용자가 카메라 렌즈(Vision Lens)를 통해 촬영하여 제공한 사진을 분석하여 유용하고 생생한 해설 정보를 제공하세요.

[사용자 위치 정보]
현재 위치: {request.user_location}

[임무]
1. 이미지에 찍힌 주요 대상(메뉴판, 표지판, 랜드마크, 음식, 관광상품 등)이 무엇인지 식별하세요.
2. 이미지 내에 텍스트가 적혀 있다면(예: 현지 외국어 메뉴, 경고판 등) 해당 텍스트를 최대한 판독하여 'items' 리스트에 넣고 한국어로 정확하게 번역 및 설명하세요.
3. 이미지 내의 핵심 사물이나 글자들에 대해 각각 번역명(translated_name), 설명(explanation), 개별 문화적 가이드(cultural_context)를 작성하세요.
4. 사용자의 현재 위치 정보('{request.user_location}')를 토대로, 해당 상황에서 사용자가 지켜야 할 전반적인 여행 예티켓이나 꿀팁(예: 현지 매너, 주문 팁, 주의 사항 등)을 'cultural_context' 필드에 상세하게 해설하세요.

[유형 선택 가이드]
identified_type 필드에는 다음 중 가장 적절한 하나만 영문 소문자로 지정하세요:
- "menu" (식당 음식, 메뉴판 등)
- "sign" (길거리 표지판, 지하철 안내판, 박물관 설명문 등)
- "landmark" (유명 건축물, 관광지, 문화유산 등)
- "object" (일반 사물, 선물, 굿즈 등)
- "other" (위 유형에 분류하기 모호한 경우)

반드시 완전한 한국어로 답변하세요.
"""
                # Gemini 1.5 Flash 호출 (Pydantic 구조화 스키마 강제)
                response = self.client.models.generate_content(
                    model=self.target_model,
                    contents=[image_part, prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=VisionLensData,
                    )
                )

                # 자동 파싱 및 반환
                return VisionLensData.model_validate_json(response.text)

            except Exception as e:
                print(f"❌ Gemini Vision 멀티모달 호출 오류: {e}")
                return self._get_fallback_data(
                    request.user_location, 
                    "이미지 분석 에러", 
                    f"이미지를 분석하는 도중 오류가 발생했습니다: {str(e)}"
                )

        else:
            # ==========================================
            # [텍스트 전용 모드 - Text-Only Analysis]
            # ==========================================
            if not request.extracted_text:
                return self._get_fallback_data(
                    request.user_location, 
                    "입력 오류", 
                    "텍스트 분석을 위한 extracted_text 데이터가 누락되었습니다."
                )

            try:
                prompt = f"""
[역할]
당신은 여행 중인 한국인 사용자를 돕는 스마트 AI 비서이자 가이드입니다.
사용자가 입력한 외국어 텍스트를 한국어로 해석하고 유용한 문화 해설 정보를 제공하세요.

[사용자 위치 정보]
현재 위치: {request.user_location}

[해석할 현지 텍스트]
{request.extracted_text}

[임무]
1. 제공된 텍스트를 정확하게 번역 및 설명하세요.
2. 텍스트에 여러 항목이 나열되어 있는 경우(예: 영수증, 메뉴 등) 각 항목별로 이름을 분리하여 'items' 리스트 형태로 번역과 개별 설명을 작성하세요.
3. 사용자의 현재 위치 정보('{request.user_location}')를 바탕으로, 해당 텍스트를 보고 알아두어야 할 현지 문화적 맥락(에티켓, 팁, 유래 등)을 'cultural_context' 필드에 해설하세요.

[유형 선택 가이드]
identified_type 필드에는 "menu", "sign", "landmark", "object", "other" 중 하나를 영문 소문자로 지정하세요.

반드시 완전한 한국어로 답변하세요.
"""
                # Gemini 1.5 Flash 호출
                response = self.client.models.generate_content(
                    model=self.target_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=VisionLensData,
                    )
                )

                return VisionLensData.model_validate_json(response.text)

            except Exception as e:
                print(f"❌ Gemini Vision 텍스트 분석 호출 오류: {e}")
                return self._get_fallback_data(
                    request.user_location, 
                    "텍스트 번역 에러", 
                    f"텍스트를 번역하는 도중 오류가 발생했습니다: {str(e)}"
                )
