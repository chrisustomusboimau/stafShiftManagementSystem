from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

# FIX VERCEL: Mengubah ke absolute imports agar aman dieksekusi di lingkungan serverless Vercel
from database import get_session
from schemas import Token, UserOut
from security import authenticate_user, create_access_token, get_current_user, pwd_context
from models import User, Staff

# Konfigurasi logging standar Vercel
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    logger.info(f"LOG-AUTH: Menerima request login untuk username '{form.username}'...")
    try:
        # 1. Jalur Pertama: Coba autentikasi menggunakan fungsi bawaan (untuk tabel User / Admin)
        logger.info("LOG-AUTH: Mencoba autentikasi pada tabel User (Admin)...")
        user = authenticate_user(session, form.username, form.password)
        if user:
            logger.info(f"LOG-AUTH: Autentikasi tabel User sukses untuk @{user.username}. Membuat token...")
            token = create_access_token(sub=user.username, role=user.role)
            logger.info("LOG-AUTH: Token akses berhasil diterbitkan untuk Admin.")
            return Token(access_token=token)

        # 2. Jalur Kedua: Jika tidak ada di tabel User, cari di tabel Staff (untuk Staf biasa)
        logger.info("LOG-AUTH: User admin tidak cocok. Mencoba pencarian pada tabel Staff...")
        staff = session.exec(select(Staff).where(Staff.username == form.username)).first()
        
        if staff:
            logger.info(f"LOG-AUTH: Username ditemukan di tabel Staff. Memverifikasi Bcrypt hash...")
            if staff.hashed_password:
                # Verifikasi password mentah dari form dengan bcrypt hash di tabel staff
                if pwd_context.verify(form.password, staff.hashed_password):
                    logger.info(f"LOG-AUTH: Password cocok untuk staf @{staff.username}. Membuat token...")
                    # Buat token akses dengan sub username dan role milik staff
                    token = create_access_token(sub=staff.username, role=staff.role or "staff")
                    logger.info("LOG-AUTH: Token akses berhasil diterbitkan untuk Staff.")
                    return Token(access_token=token)
                else:
                    logger.warning(f"LOG-AUTH: Password salah untuk staf @{form.username}.")
            else:
                logger.error(f"LOG-AUTH [DATA ERROR]: Staf @{form.username} ditemukan, tetapi kolom hashed_password kosong!")
        else:
            logger.warning(f"LOG-AUTH: Username '{form.username}' tidak ditemukan di tabel User maupun Staff.")

        # 3. Jika kedua jalur gagal, lempar error Unauthorized
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except HTTPException:
        # Lempar ulang jika merupakan error kredensial 401 yang memang sengaja kita buat
        raise
    except Exception as e:
        logger.error(f"LOG-AUTH [FATAL ERROR] Terjadi crash total pada endpoint /auth/login: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication pipeline crash: {str(e)}"
        )


@router.get("/me", response_model=UserOut)
def me(user=Depends(get_current_user)):
    logger.info("LOG-AUTH: Mengakses endpoint /auth/me untuk memeriksa profil token saat ini...")
    try:
        return user
    except Exception as e:
        logger.error(f"LOG-AUTH [ERROR] Gagal memproses objek user di /me: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to look up profile session info data structures."
        )