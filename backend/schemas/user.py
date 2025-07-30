# backend/schemas/user.py

from pydantic import BaseModel, EmailStr
from typing import Optional

# --- CORE USER SCHEMAS ---

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserUpdate(BaseModel): # Often used for patching, so fields are optional
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None # Allow deactivating users
    role: Optional[str] = None # Allow updating role via admin panel
    is_admin: Optional[bool] = None # Allow admin to update admin status

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool # Crucial: Include is_admin for auth and admin checks
    role: str # Include role for role-based access control

    class Config:
        from_attributes = True # For Pydantic v2. For Pydantic v1, use `orm_mode = True`
