# backend/create_admin.py

import os
import sys
sys.path.append(os.path.abspath("."))

from backend.database import SessionLocal
from backend.models import User
from passlib.hash import bcrypt

def create_admin():
    db = SessionLocal()

    email = "admin@crawford.app"
    username = "superadmin"
    password = "secure_admin_password"

    # Prevent duplicate admin
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print("⚠️ Admin already exists.")
        return

    hashed_password = bcrypt.hash(password)

    admin_user = User(
        email=email,
        username=username,
        hashed_password=hashed_password,
        is_admin=True,
        role="admin"
    )

    db.add(admin_user)
    db.commit()
    db.close()
    print("✅ Admin created.")

if __name__ == "__main__":
    create_admin()
