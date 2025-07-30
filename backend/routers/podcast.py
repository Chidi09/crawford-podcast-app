# backend/routers/podcast.py

import os
import shutil
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend import models
from backend.schemas.podcast import PodcastResponse
from backend.database import get_db
from backend.routers.auth import get_current_user, get_current_lecturer_or_admin_user

router = APIRouter()

# Define the directory to save uploaded files on the server
UPLOAD_DIRECTORY = "./backend/uploads"
# Define the URL path that the frontend will use to access these files
URL_PATH_PREFIX = "/uploads"

# Ensure upload directory exists
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

def _fix_podcast_urls(podcast: models.Podcast) -> models.Podcast:
    """
    A helper function to fix outdated podcast URL formats on the fly.
    This corrects old, local-style paths (e.g., './backend/uploads\\file.mp3')
    into web-accessible URLs (e.g., '/uploads/file.mp3').
    """
    # --- Fix audio file URL ---
    if podcast.audio_file_url and ("\\" in podcast.audio_file_url or podcast.audio_file_url.startswith(".")):
        filename = os.path.basename(podcast.audio_file_url)
        podcast.audio_file_url = f"{URL_PATH_PREFIX}/{filename}"

    # --- Fix cover art URL ---
    if podcast.cover_art_url and ("\\" in podcast.cover_art_url or podcast.cover_art_url.startswith(".")):
        filename = os.path.basename(podcast.cover_art_url)
        podcast.cover_art_url = f"{URL_PATH_PREFIX}/{filename}"
    
    return podcast


@router.post("/", response_model=PodcastResponse, status_code=status.HTTP_201_CREATED)
async def create_podcast(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    duration_minutes: Optional[int] = Form(None),
    audio_file: UploadFile = File(...),
    cover_art: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_lecturer_or_admin_user)
):
    # Generate unique filenames to prevent conflicts
    audio_filename = f"{uuid4()}_{audio_file.filename}"
    audio_path = os.path.join(UPLOAD_DIRECTORY, audio_filename)
    audio_file_url = f"{URL_PATH_PREFIX}/{audio_filename}"

    cover_art_url = None
    cover_art_path = None
    if cover_art:
        cover_art_filename = f"{uuid4()}_{cover_art.filename}"
        cover_art_path = os.path.join(UPLOAD_DIRECTORY, cover_art_filename)
        cover_art_url = f"{URL_PATH_PREFIX}/{cover_art_filename}"

    try:
        # Save the actual files to the server's file system
        with open(audio_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)

        if cover_art and cover_art_path:
            with open(cover_art_path, "wb") as buffer:
                shutil.copyfileobj(cover_art.file, buffer)

        # Store the correct URL paths in the database
        db_podcast = models.Podcast(
            title=title,
            description=description,
            audio_file_url=audio_file_url,
            cover_art_url=cover_art_url,
            owner_id=current_user.id,
            author=author,
            duration_minutes=duration_minutes,
            uploaded_at=func.now(),
            views=0,
            plays=0
        )
        db.add(db_podcast)
        db.commit()
        db.refresh(db_podcast)
        return db_podcast
    except Exception as e:
        if os.path.exists(audio_path):
            os.remove(audio_path)
        if cover_art_path and os.path.exists(cover_art_path):
            os.remove(cover_art_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload podcast: {e}"
        )

@router.get("/", response_model=List[PodcastResponse])
def get_all_podcasts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    podcasts = db.query(models.Podcast).offset(skip).limit(limit).all()
    # --- MODIFIED: Fix URLs on the fly before sending to the client ---
    fixed_podcasts = [_fix_podcast_urls(p) for p in podcasts]
    return fixed_podcasts

@router.get("/{podcast_id}", response_model=PodcastResponse)
def get_podcast_by_id(
    podcast_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if podcast is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found")

    # Increment views before returning
    podcast.views += 1
    db.add(podcast)
    db.commit()
    db.refresh(podcast)
    
    # --- MODIFIED: Fix URLs on the fly before sending to the client ---
    return _fix_podcast_urls(podcast)

@router.post("/{podcast_id}/play", status_code=status.HTTP_200_OK)
def increment_podcast_play(
    podcast_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if podcast is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found")

    podcast.plays += 1
    db.add(podcast)
    db.commit()
    db.refresh(podcast)
    return {"message": "Play count incremented", "plays": podcast.plays}


@router.put("/{podcast_id}", response_model=PodcastResponse)
async def update_podcast(
    podcast_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    duration_minutes: Optional[int] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    cover_art: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_lecturer_or_admin_user)
):
    db_podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if db_podcast is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found")

    if db_podcast.owner_id != current_user.id and current_user.role not in ["lecturer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this podcast"
        )

    if title is not None:
        db_podcast.title = title
    if description is not None:
        db_podcast.description = description
    if author is not None:
        db_podcast.author = author
    if duration_minutes is not None:
        db_podcast.duration_minutes = duration_minutes

    if audio_file:
        if db_podcast.audio_file_url:
            old_file_path = os.path.join(UPLOAD_DIRECTORY, os.path.basename(db_podcast.audio_file_url))
            if os.path.exists(old_file_path):
                os.remove(old_file_path)
        
        audio_filename = f"{uuid4()}_{audio_file.filename}"
        audio_path = os.path.join(UPLOAD_DIRECTORY, audio_filename)
        with open(audio_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)
        db_podcast.audio_file_url = f"{URL_PATH_PREFIX}/{audio_filename}"

    if cover_art:
        if db_podcast.cover_art_url:
            old_file_path = os.path.join(UPLOAD_DIRECTORY, os.path.basename(db_podcast.cover_art_url))
            if os.path.exists(old_file_path):
                os.remove(old_file_path)

        cover_art_filename = f"{uuid4()}_{cover_art.filename}"
        cover_art_path = os.path.join(UPLOAD_DIRECTORY, cover_art_filename)
        with open(cover_art_path, "wb") as buffer:
            shutil.copyfileobj(cover_art.file, buffer)
        db_podcast.cover_art_url = f"{URL_PATH_PREFIX}/{cover_art_filename}"

    db.commit()
    db.refresh(db_podcast)
    return db_podcast


@router.delete("/{podcast_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_podcast(
    podcast_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_lecturer_or_admin_user)
):
    db_podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if db_podcast is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found")

    if db_podcast.owner_id != current_user.id and current_user.role not in ["lecturer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this podcast"
        )

    if db_podcast.audio_file_url:
        file_to_delete = os.path.join(UPLOAD_DIRECTORY, os.path.basename(db_podcast.audio_file_url))
        if os.path.exists(file_to_delete):
            os.remove(file_to_delete)
    if db_podcast.cover_art_url:
        file_to_delete = os.path.join(UPLOAD_DIRECTORY, os.path.basename(db_podcast.cover_art_url))
        if os.path.exists(file_to_delete):
            os.remove(file_to_delete)

    db.delete(db_podcast)
    db.commit()
    return {"message": "Podcast deleted successfully"}
