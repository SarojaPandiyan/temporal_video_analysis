from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"

class MessageMetadata(BaseModel):
    model_name: Optional[str] = None
    token_count: Optional[int] = 0
    finish_reason: Optional[str] = None
    sources: Optional[List[str]] = Field(default_factory=list)

class ChatRequest(BaseModel):
    content: str
    session_id: Optional[str] | None = None

class ChatMessage(BaseModel):
    # For DB and UI tracking
    id: str
    session_id: str
    
    # Core LLM requirements
    role: MessageRole
    content: str
    
    # Contextual data
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[MessageMetadata] = Field(default_factory=MessageMetadata)
    
    # UI/State management
    is_streaming: bool = False
    is_error: bool = False

    model_config = ConfigDict(from_attributes=True)
    
class ChatSession(BaseModel):
    session_id: str
    user_id: str
    title: str
    updated_at: Optional[datetime]
    
class ChatMessages(BaseModel):
    session_id: str
    messages: List[ChatMessage] = Field(default_factory=list)
    
class ChatHistory(BaseModel):
    chat_sessions: List[ChatSession]