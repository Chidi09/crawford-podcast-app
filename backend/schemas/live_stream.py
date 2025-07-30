# backend/schemas/live_stream.py

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class LiveStreamBase(BaseModel):
    title: str
    description: Optional[str] = None
    stream_url: Optional[str] = None

class LiveStreamCreate(LiveStreamBase):
    status: str = Field("offline", pattern="^(live|offline|scheduled)$")

class LiveStreamUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    stream_url: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(live|offline|scheduled)$")
    current_viewers: Optional[int] = None

class LiveStreamResponse(LiveStreamBase):
    id: int
    host_id: int
    status: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    current_viewers: int
    total_views: int

    class Config:
        from_attributes = True
