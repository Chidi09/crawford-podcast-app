# backend/schemas/auth.py

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
# from datetime import datetime # Not directly used in these schemas, so removed for clarity

# --- User Creation Schema ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = Field("user", pattern="^(user|lecturer|admin)$")

# --- TOKEN SCHEMAS ---
class Token(BaseModel):
    access_token: str
    token_type: str
    is_admin: bool = False
    user_role: str = "user"

class TokenData(BaseModel):
    username: Optional[str] = None
    id: Optional[int] = None
    email: Optional[EmailStr] = None
    is_admin: Optional[bool] = None
    role: Optional[str] = None
