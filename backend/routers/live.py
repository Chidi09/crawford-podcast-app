# backend/routers/live.py

import os
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend import models
# MODIFIED: Import LiveStream schemas from the new modularized file
from backend.schemas.live_stream import (
    LiveStreamBase, LiveStreamCreate, LiveStreamUpdate, LiveStreamResponse
)
# MODIFIED: Import UserResponse from backend.schemas.user
from backend.schemas.user import UserResponse

from backend.database import get_db
# Import role-specific dependencies
from backend.routers.auth import get_current_user, get_current_lecturer_or_admin_user, get_current_active_admin_user

router = APIRouter()

# Define the directory for live stream related files (e.g., thumbnails, if any)
LIVE_UPLOAD_DIRECTORY = "./backend/uploads/live"
os.makedirs(LIVE_UPLOAD_DIRECTORY, exist_ok=True)

@router.post("/", response_model=LiveStreamResponse, status_code=status.HTTP_201_CREATED)
async def create_live_stream(
    stream_create: LiveStreamCreate,
    db: Session = Depends(get_db),
    # Only lecturers and admins can create live streams
    current_user: models.User = Depends(get_current_lecturer_or_admin_user)
):
    """
    Creates a new live stream entry (e.g., for scheduling).
    Requires 'lecturer' or 'admin' role.
    """
    # Check if the user already has an active or scheduled stream
    existing_stream = db.query(models.LiveStream).filter(
        models.LiveStream.host_id == current_user.id,
        models.LiveStream.status.in_(["live", "scheduled"])
    ).first()
    if existing_stream:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active or scheduled live stream."
        )

    db_live_stream = models.LiveStream(
        title=stream_create.title,
        description=stream_create.description,
        stream_url=stream_create.stream_url,
        status=stream_create.status,
        host_id=current_user.id,
        start_time=func.now() if stream_create.status == "live" else None,
        current_viewers=0,
        total_views=0
    )
    db.add(db_live_stream)
    db.commit()
    db.refresh(db_live_stream)
    return db_live_stream

@router.get("/", response_model=List[LiveStreamResponse])
def get_all_live_streams(
    status: Optional[str] = None, # Filter by status
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user) # Any logged-in user can view
):
    """
    Retrieves a list of all live streams, optionally filtered by status.
    Requires authentication.
    """
    query = db.query(models.LiveStream)
    if status:
        query = query.filter(models.LiveStream.status == status)
    live_streams = query.offset(skip).limit(limit).all()
    return live_streams

@router.get("/{stream_id}", response_model=LiveStreamResponse)
def get_live_stream_by_id(
    stream_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user) # Any logged-in user can view
):
    """
    Retrieves a single live stream by its ID.
    Requires authentication.
    """
    live_stream = db.query(models.LiveStream).filter(models.LiveStream.id == stream_id).first()
    if live_stream is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Live stream not found")
    return live_stream

@router.put("/{stream_id}", response_model=LiveStreamResponse)
async def update_live_stream(
    stream_id: int,
    stream_update: LiveStreamUpdate,
    db: Session = Depends(get_db),
    # Only host or admin can update
    current_user: models.User = Depends(get_current_lecturer_or_admin_user)
):
    """
    Updates an existing live stream. Only the host or an admin can update.
    Requires 'lecturer' or 'admin' role.
    """
    db_live_stream = db.query(models.LiveStream).filter(models.LiveStream.id == stream_id).first()
    if db_live_stream is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Live stream not found")

    if db_live_stream.host_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this live stream"
        )

    update_data = stream_update.model_dump(exclude_unset=True)

    # Handle status changes
    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == "live" and db_live_stream.status != "live":
            db_live_stream.start_time = func.now() # Set start time when going live
            db_live_stream.end_time = None # Clear end time
        elif new_status == "offline" and db_live_stream.status == "live":
            db_live_stream.end_time = func.now() # Set end time when going offline
            # Optionally, reset current_viewers to 0 when offline
            db_live_stream.current_viewers = 0

    for key, value in update_data.items():
        setattr(db_live_stream, key, value)

    db.commit()
    db.refresh(db_live_stream)
    return db_live_stream

@router.delete("/{stream_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_live_stream(
    stream_id: int,
    db: Session = Depends(get_db),
    # Only host or admin can delete
    current_user: models.User = Depends(get_current_lecturer_or_admin_user)
):
    """
    Deletes a live stream. Only the host or an admin can delete.
    Requires 'lecturer' or 'admin' role.
    """
    db_live_stream = db.query(models.LiveStream).filter(models.LiveStream.id == stream_id).first()
    if db_live_stream is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Live stream not found")

    if db_live_stream.host_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this live stream"
        )

    db.delete(db_live_stream)
    db.commit()
    return {"message": "Live stream deleted successfully"}

# NEW: Endpoint to increment live stream viewers (e.g., called by frontend when user joins)
@router.post("/{stream_id}/join", status_code=status.HTTP_200_OK)
def join_live_stream(
    stream_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user) # Any logged-in user can join
):
    """
    Increments the current_viewers count for a live stream.
    Requires authentication.
    """
    live_stream = db.query(models.LiveStream).filter(models.LiveStream.id == stream_id).first()
    if live_stream is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Live stream not found")
    
    if live_stream.status != "live":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stream is not currently live.")

    live_stream.current_viewers += 1
    live_stream.total_views += 1 # Also increment total views
    db.add(live_stream)
    db.commit()
    db.refresh(live_stream)
    return {"message": "Joined stream", "current_viewers": live_stream.current_viewers}

# NEW: Endpoint to decrement live stream viewers (e.g., called by frontend when user leaves)
@router.post("/{stream_id}/leave", status_code=status.HTTP_200_OK)
def leave_live_stream(
    stream_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user) # Any logged-in user can leave
):
    """
    Decrements the current_viewers count for a live stream.
    Requires authentication.
    """
    live_stream = db.query(models.LiveStream).filter(models.LiveStream.id == stream_id).first()
    if live_stream is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Live stream not found")

    if live_stream.current_viewers > 0:
        live_stream.current_viewers -= 1
    db.add(live_stream)
    db.commit()
    db.refresh(live_stream)
    return {"message": "Left stream", "current_viewers": live_stream.current_viewers}

