# backend/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt

# MODIFIED: Import Token, UserCreate, TokenData from backend.schemas.auth
from backend.schemas.auth import Token, UserCreate, TokenData
# MODIFIED: Import UserResponse from backend.schemas.user
from backend.schemas.user import UserResponse

from backend.models import User as DBUser
from backend.database import get_db
from backend.utils import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    SECRET_KEY,
    ALGORITHM
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter(tags=["Auth"])

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.username,
            "user_id": user.id, # Include user_id
            "email": user.email, # Include email
            "is_admin": user.is_admin, # Include is_admin
            "role": user.role # NEW: Include user's role
        },
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_admin": user.is_admin, # Return is_admin in response
        "user_role": user.role # NEW: Return user_role in response
    }

# MODIFIED: get_current_user to return UserResponse with role
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id") # Get user_id from payload
        email: str = payload.get("email") # Get email from payload
        is_admin: bool = payload.get("is_admin", False) # Get is_admin
        role: str = payload.get("role", "user") # Get role

        if username is None or user_id is None:
            raise credentials_exception

        user = db.query(DBUser).filter(DBUser.id == user_id).first() # Query by ID for robustness
        if user is None or user.username != username: # Double-check username for security
            raise credentials_exception
        
        # Ensure the user object returned matches UserResponse schema
        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            is_admin=user.is_admin,
            role=user.role
        )
    except JWTError as e:
        print(f"JWT Error during decoding: {e}")
        raise credentials_exception

async def get_current_active_user(current_user: UserResponse = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user

# NEW: Dependency to check for specific roles (e.g., lecturer, admin)
def get_current_lecturer_or_admin_user(current_user: UserResponse = Depends(get_current_active_user)):
    if current_user.role not in ["lecturer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted: Lecturer or Admin privileges required."
        )
    return current_user

# NEW: Dependency to check for admin role
def get_current_active_admin_user(current_user: UserResponse = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted: Admin privileges required."
        )
    return current_user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_create: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(DBUser).filter(DBUser.username == user_create.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    db_user_email = db.query(DBUser).filter(DBUser.email == user_create.email).first()
    if db_user_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user_create.password)
    db_user = DBUser(
        username=user_create.username,
        email=user_create.email,
        hashed_password=hashed_password,
        # NEW: Set role from UserCreate schema (default is 'user')
        role=user_create.role,
        # Set is_admin based on role, or keep separate if needed
        is_admin=(user_create.role == "admin")
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return UserResponse.model_validate(db_user) # Use model_validate for Pydantic v2

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserResponse = Depends(get_current_active_user)):
    return current_user

