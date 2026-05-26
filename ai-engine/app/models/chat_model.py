from pydantic import BaseModel
from typing import List, Optional

# ==========================================
# 5. /chat/ask 관련 모델
# ==========================================
class ChatAskRequest(BaseModel):
    user_id: str
    user_name: Optional[str] = "User"
    current_location: str
    message: str
    dna_type: Optional[str] = None
    chat_history_id: str

class ChatAskData(BaseModel):
    reply_message: str
    cultural_tips: List[str]
    suggested_actions: List[str]

class ChatAskResponse(BaseModel):
    status: str
    data: ChatAskData
