from pydantic import BaseModel
from typing import Optional

# ==========================================
# 3. /vision/lens 관련 모델
# ==========================================
class VisionLensRequest(BaseModel):
    user_location: str
    extracted_text: Optional[str] = None
    image_base64: Optional[str] = None
    mode: str = "auto" # "text_only", "image_only", "auto" 등

class VisionLensData(BaseModel):
    identified_type: str
    identified_object: Optional[str] = None
    translated_text: Optional[str] = None
    explanation: str
    cultural_context: str

class VisionLensResponse(BaseModel):
    status: str
    data: VisionLensData
