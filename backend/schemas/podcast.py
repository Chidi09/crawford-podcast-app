# backend/schemas/podcast.py

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

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
