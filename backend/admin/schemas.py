# backend/schemas.py

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# --- CORE USER SCHEMAS ---

class UserBase(BaseModel):
    username: str
    email: EmailStr

# UserCreate, Token, TokenData are now in backend.schemas.auth

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None # Allow deactivating users
    role: Optional[str] = Field(None, pattern="^(user|lecturer|admin)$")
    is_admin: Optional[bool] = None # Allow admin to update admin status

class UserResponse(UserBase):
    id: int
    is_active: bool
    role: str # Include role in response
    is_admin: bool # Crucial: Include is_admin for auth and admin checks

    class Config:
        from_attributes = True # For Pydantic v2. For Pydantic v1, use `orm_mode = True`

# --- PODCAST SCHEMAS ---

class PodcastBase(BaseModel):
    title: str
    description: Optional[str] = None
    author: Optional[str] = None
    duration_minutes: Optional[int] = None

class PodcastCreate(PodcastBase):
    pass

class PodcastResponse(PodcastBase):
    id: int
    owner_id: int
    audio_file_url: Optional[str] = None
    cover_art_url: Optional[str] = None
    uploaded_at: datetime
    views: int
    plays: int

    class Config:
        from_attributes = True

# Live Stream schemas are in backend/schemas/live_stream.py
