# backend/admin/router.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func # Import func for database functions

# Use absolute imports, starting with 'backend.'
from backend.database import get_db
# Import role-specific dependency for admin
from backend.routers.auth import get_current_active_admin_user
# MODIFIED: Import UserResponse and UserUpdate from backend.schemas.user
from backend.schemas.user import UserResponse, UserUpdate
# MODIFIED: Import UserCreate from backend.schemas.auth
from backend.schemas.auth import UserCreate
# MODIFIED: Import PodcastResponse from backend.schemas.podcast
from backend.schemas.podcast import PodcastResponse
# MODIFIED: Import LiveStreamResponse from backend.schemas.live_stream
from backend.schemas.live_stream import LiveStreamResponse
from backend.models import User as DBUser, Podcast, LiveStream # Import Podcast and LiveStream models

# For password hashing (already in utils, but good to have context if moved here)
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Create the router
router = APIRouter(
    tags=["Admin"],
    responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_active_admin_user)] # All admin routes require admin privileges
)

# --- User Management (Admin Only) ---

@router.get("/users", response_model=List[UserResponse])
def get_all_users_admin(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    # current_admin: DBUser = Depends(get_current_active_admin_user) # Dependency already on router
):
    """
    Retrieves a list of all users. Accessible only by admin users.
    """
    users = db.query(DBUser).offset(skip).limit(limit).all()
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_by_id_admin(
    user_id: int,
    db: Session = Depends(get_db),
    # current_admin: DBUser = Depends(get_current_active_admin_user)
):
    """
    Retrieves a single user by ID. Accessible only by admin users.
    """
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user_admin(
    user_id: int,
    user_update: UserUpdate, # Reusing UserUpdate schema
    db: Session = Depends(get_db),
    # current_admin: DBUser = Depends(get_current_active_admin_user)
):
    """
    Updates a user's information (including admin status, active status, role). Accessible only by admin users.
    """
    db_user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = user_update.model_dump(exclude_unset=True) # Use model_dump for Pydantic v2

    # Handle password hashing if password is provided
    if "password" in update_data and update_data["password"] is not None:
        from backend.utils import get_password_hash
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    # Ensure role update is valid if provided
    if "role" in update_data and update_data["role"] is not None:
        if update_data["role"] not in ["user", "lecturer", "admin"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role specified.")
        # Automatically set is_admin based on role if role is changed to admin
        if update_data["role"] == "admin":
            db_user.is_admin = True
        elif db_user.role == "admin" and update_data["role"] != "admin":
            # If changing from admin to non-admin, set is_admin to False
            db_user.is_admin = False


    for key, value in update_data.items():
        # Skip password as it's handled separately
        if key == "password":
            continue
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_admin(
    user_id: int,
    db: Session = Depends(get_db),
    # current_admin: DBUser = Depends(get_current_active_admin_user)
):
    """
    Deletes a user. Accessible only by admin users.
    """
    db_user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}

# --- Podcast Management (Admin Only) ---

@router.get("/podcasts", response_model=List[PodcastResponse])
def get_all_podcasts_admin(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    # current_admin: DBUser = Depends(get_current_active_admin_user)
):
    """
    Retrieves a list of all podcasts (including stats). Accessible only by admin users.
    """
    podcasts = db.query(Podcast).offset(skip).limit(limit).all()
    return podcasts

@router.delete("/podcasts/{podcast_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_podcast_admin(
    podcast_id: int,
    db: Session = Depends(get_db),
    # current_admin: DBUser = Depends(get_current_active_admin_user)
):
    """
    Deletes any podcast. Accessible only by admin users.
    This bypasses the owner/lecturer check in the regular podcast router.
    """
    db_podcast = db.query(Podcast).filter(Podcast.id == podcast_id).first()
    if db_podcast is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found")

    # Delete associated files from the server
    import os
    if db_podcast.audio_file_url and os.path.exists(db_podcast.audio_file_url):
        os.remove(db_podcast.audio_file_url)
    if db_podcast.cover_art_url and os.path.exists(db_podcast.cover_art_url):
        os.remove(db_podcast.cover_art_url)

    db.delete(db_podcast)
    db.commit()
    return {"message": "Podcast deleted successfully by admin"}

# NEW: Live Stream Management (Admin Only)
@router.get("/live-streams", response_model=List[LiveStreamResponse])
def get_all_live_streams_admin(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    # current_admin: DBUser = Depends(get_current_active_admin_user)
):
    """
    Retrieves a list of all live streams (including stats). Accessible only by admin users.
    """
    live_streams = db.query(LiveStream).offset(skip).limit(limit).all()
    return live_streams

@router.put("/live-streams/{stream_id}/status", response_model=LiveStreamResponse)
def update_live_stream_status_admin(
    stream_id: int,
    status_update: str, # Expecting just the new status string
    db: Session = Depends(get_db),
):
    """
    Updates the status of a live stream. Accessible only by admin users.
    """
    db_live_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if db_live_stream is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Live stream not found")

    if status_update not in ["live", "offline", "scheduled"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status. Must be 'live', 'offline', or 'scheduled'.")

    # Handle status changes (similar to live.py update logic)
    if status_update == "live" and db_live_stream.status != "live":
        db_live_stream.start_time = func.now()
        db_live_stream.end_time = None
    elif status_update == "offline" and db_live_stream.status == "live":
        db_live_stream.end_time = func.now()
        db_live_stream.current_viewers = 0 # Reset viewers when stream goes offline

    db_live_stream.status = status_update
    db.commit()
    db.refresh(db_live_stream)
    return db_live_stream

@router.delete("/live-streams/{stream_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_live_stream_admin(
    stream_id: int,
    db: Session = Depends(get_db),
    # current_admin: DBUser = Depends(get_current_active_admin_user)
):
    """
    Deletes any live stream. Accessible only by admin users.
    """
    db_live_stream = db.query(LiveStream).filter(LiveStream.id == stream_id).first()
    if db_live_stream is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Live stream not found")

    db.delete(db_live_stream)
    db.commit()
    return {"message": "Live stream deleted successfully by admin"}
