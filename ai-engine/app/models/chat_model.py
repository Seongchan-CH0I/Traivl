from pydantic import BaseModel
from typing import List

# ==========================================
# 5. /chat/ask 관련 모델
# ==========================================
class ChatAskRequest(BaseModel):
    user_id: int
    current_location: str
    message: str
    chat_history_id: str

class ChatAskData(BaseModel):
    reply_message: str
    cultural_tips: List[str]
    suggested_actions: List[str]

class ChatAskResponse(BaseModel):
    status: str
    data: ChatAskData
