# backend/dependencies.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from backend import models  # Correct absolute import
from backend.database import get_db  # Correct absolute import
from backend.utils import SECRET_KEY, ALGORITHM  # JWT settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"\n--- DEBUG get_current_user ---")
        print(f"Token received (first 30 chars): {token[:30]}...")
        print(f"SECRET_KEY used for decoding: '{SECRET_KEY}'")
        print(f"ALGORITHM used for decoding: '{ALGORITHM}'")
        print(f"--- END DEBUG ---\n")

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            username: str = payload.get("username")
            if username is None:
                raise credentials_exception
        user = db.query(models.User).filter(models.User.username == username).first()
        if user is None:
            raise credentials_exception
        return user
    except JWTError as e:
        print(f"JWT Error during decoding: {e}")
        raise credentials_exception

def get_current_active_admin_user(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted: Admin privileges required."
        )
    return current_user
