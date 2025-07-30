# backend/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .routers import auth, podcast, live
from .admin.router import router as admin_router
from .database import get_db
from . import models
from .dependencies import get_current_user, get_current_active_admin_user

app = FastAPI(
    title="Crawford Podcast App API",
    description="Backend for podcast streaming application",
    version="1.0.0"
)

# Mount the 'uploads' directory
app.mount("/uploads", StaticFiles(directory="./backend/uploads"), name="uploads")

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(
    podcast.router,
    prefix="/api/podcasts",
    tags=["Podcasts"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    live.router,
    prefix="/api/live",
    tags=["Live Streams"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    admin_router,
    prefix="/api/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_active_admin_user)]
)

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"status": "degraded", "database": "disconnected", "error": str(e)})

@app.get("/")
def read_root():
    return {"message": "Welcome to Crawford Podcast API"}

# 🔍 DEBUG ENDPOINT
@app.get("/api/debug/user")
def debug_user(user=Depends(get_current_user)):
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "is_admin": user.is_admin,
        "is_active": user.is_active,
    }
