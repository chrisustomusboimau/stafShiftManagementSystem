from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session, select

# FIX VERCEL: Mengubah ke absolute imports agar modul dapat dilacak dengan tepat oleh serverless runtime
from database import get_session, settings
from models import User, Staff

# Konfigurasi logging standar agar tercatat jelas di dashboard Vercel
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

ALGORITHM = "HS256"


def hash_password(p: str) -> str:
    try:
        return pwd_context.hash(p)
    except Exception as e:
        logger.error(f"LOG-SECURITY [ERROR] Gagal melakukan hashing password: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal password hashing error")


def verify_password(p: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(p, hashed)
    except Exception as e:
        logger.error(f"LOG-SECURITY [ERROR] Gagal melakukan verifikasi password (Bcrypt crash?): {str(e)}", exc_info=True)
        return False


def create_access_token(sub: str, role: str) -> str:
    try:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
        payload = {"sub": sub, "role": role, "exp": expire}
        
        # Log jika secret_key menggunakan nilai default bawaan (warning untuk aspek keamanan)
        if settings.secret_key == "dev-secret-change-me":
            logger.warning("LOG-SECURITY [WARNING]: Aplikasi menggunakan SECRET_KEY default!")
            
        return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)
    except Exception as e:
        logger.error(f"LOG-SECURITY [FATAL ERROR] Gagal membuat JWT token: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate authentication token")


def authenticate_user(session: Session, username: str, password: str) -> Optional[User]:
    try:
        logger.info(f"LOG-SECURITY: Mencoba otentikasi user '{username}' di database...")
        user = session.exec(select(User).where(User.username == username)).first()
        
        if not user:
            logger.warning(f"LOG-SECURITY: User '{username}' tidak ditemukan di tabel User.")
            return None
            
        if not verify_password(password, user.password_hash):
            logger.warning(f"LOG-SECURITY: Password untuk user '{username}' tidak cocok.")
            return None
            
        logger.info(f"LOG-SECURITY: Otentikasi sukses untuk user '{username}'.")
        return user
    except Exception as e:
        logger.error(f"LOG-SECURITY [FATAL ERROR] Terjadi crash pada proses authenticate_user(): {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database authentication query crash: {str(e)}")


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
            logger.warning("LOG-SECURITY: Payload JWT tidak memiliki klaim 'sub' (username).")
            raise cred_exc
    except JWTError as je:
        logger.warning(f"LOG-SECURITY: Gagal melakukan decode JWT Token (Token Expired/Invalid): {str(je)}")
        raise cred_exc
    except Exception as e:
        logger.error(f"LOG-SECURITY [ERROR]: Eror tidak terduga saat memproses decode JWT: {str(e)}", exc_info=True)
        raise cred_exc

    try:
        # 1. Jalur Pertama: Cek apakah username terdaftar di tabel User (Admin Utama)
        user = session.exec(select(User).where(User.username == username)).first()
        if user:
            return user

        # 2. Jalur Kedua: Jika tidak ada di User, cek di tabel Staff (Staf Dashboard)
        staff = session.exec(select(Staff).where(Staff.username == username)).first()
        if staff:
            return staff
    except Exception as e:
        logger.error(f"LOG-SECURITY [FATAL ERROR] Gagal melakukan query user/staff session dari token: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error during token validation")

    logger.warning(f"LOG-SECURITY: Token valid untuk '{username}' tapi subjek tidak terdaftar di database.")
    raise cred_exc


def require_admin(user: Any = Depends(get_current_user)) -> Any:
    user_role = getattr(user, "role", None)
    if user_role != "admin":
        logger.warning(f"LOG-SECURITY [RBAC]: Akses admin ditolak untuk user dengan role '{user_role}'.")
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user