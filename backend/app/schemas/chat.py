from pydantic import BaseModel
from typing import List, Optional, Any

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    system_prompt: Optional[str] = "You are Shri, a friendly and intelligent AI assistant. Your name is Shri. Always introduce yourself as Shri when asked. Be helpful, concise, and conversational."
    use_rag: Optional[bool] = True

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[Any]] = None
    rag_applied: Optional[bool] = False