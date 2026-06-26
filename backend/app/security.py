from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session, select

# FIX VERCEL: Mengubah ke absolute imports agar modul dapat dilacak dengan tepat oleh serverless runtime
from app.database import get_session, settings
from app.models import User, Staff

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

ALGORITHM = "HS256"


def hash_password(p: str) -> str:
    return pwd_context.hash(p)


def verify_password(p: str, hashed: str) -> bool:
    return pwd_context.verify(p, hashed)


def create_access_token(sub: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": sub, "role": role, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def authenticate_user(session: Session, username: str, password: str) -> Optional[User]:
    user = session.exec(select(User).where(User.username == username)).first()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


# Menggunakan type-hint Any agar fleksibel mengembalikan objek model User maupun Staff
def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> Any:
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if not username:
            raise cred_exc
    except JWTError:
        raise cred_exc

    # 1. Jalur Pertama: Cek apakah username terdaftar di tabel User (Admin Utama)
    user = session.exec(select(User).where(User.username == username)).first()
    if user:
        return user

    # 2. Jalur Kedua: Jika tidak ada di User, cek di tabel Staff (Staf Dashboard)
    staff = session.exec(select(Staff).where(Staff.username == username)).first()
    if staff:
        return staff

    # 3. Jika di kedua tabel tidak ditemukan pemilik tokennya
    raise cred_exc


# Menggunakan objek polimorfik user untuk menguji aturan RBAC (Role-Based Access Control)
def require_admin(user: Any = Depends(get_current_user)) -> Any:
    if getattr(user, "role", None) != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user