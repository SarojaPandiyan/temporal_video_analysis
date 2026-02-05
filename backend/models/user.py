from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str | None = None
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class TokenRefresh(BaseModel):          # ← NEW
    refresh_token: str

class UserOut(BaseModel):
    id: str
    username: str
    full_name: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class AuthResponse(Token):              # ← updated to include refresh
    refresh_token: Optional[str] = None
    user: UserOut