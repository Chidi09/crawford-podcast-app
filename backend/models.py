# backend/models.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base # MODIFIED: Changed to absolute import for database

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    # MODIFIED: role now supports 'user', 'lecturer', 'admin'
    role = Column(String, default="user", nullable=False)
    is_admin = Column(Boolean, default=False) # Keep for backward compatibility or specific checks

    # Relationship to Podcasts
    podcasts = relationship("Podcast", back_populates="owner")
    # NEW: Relationship to LiveStreams (if a user can host a live stream)
    live_streams = relationship("LiveStream", back_populates="host")

class Podcast(Base):
    __tablename__ = "podcasts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    audio_file_url = Column(String, unique=True, index=True)
    cover_art_url = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))

    # ADDED: New fields for statistics
    views = Column(Integer, default=0) # Number of times podcast has been viewed/loaded
    plays = Column(Integer, default=0) # Number of times podcast has been played

    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    author = Column(String, nullable=True)
    duration_minutes = Column(Integer, nullable=True)

    owner = relationship("User", back_populates="podcasts")

# NEW MODEL: LiveStream
class LiveStream(Base):
    __tablename__ = "live_streams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    # Assuming a simple status: "live", "offline", "scheduled"
    status = Column(String, default="offline", nullable=False)
    stream_url = Column(String, nullable=True) # URL for the actual live stream content (e.g., YouTube Live embed URL)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    # ADDED: New fields for live stream statistics
    current_viewers = Column(Integer, default=0)
    total_views = Column(Integer, default=0) # Total views across all live sessions
    
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    host = relationship("User", back_populates="live_streams")

    # You might add more fields like:
    # thumbnail_url = Column(String, nullable=True)
    # chat_enabled = Column(Boolean, default=True)
