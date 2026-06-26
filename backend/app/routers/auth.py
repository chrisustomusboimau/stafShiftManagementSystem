from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from ..database import get_session
from ..schemas import Token, UserOut
from ..security import authenticate_user, create_access_token, get_current_user, pwd_context
from ..models import User, Staff


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    # 1. Jalur Pertama: Coba autentikasi menggunakan fungsi bawaan (untuk tabel User / Admin)
    user = authenticate_user(session, form.username, form.password)
    if user:
        token = create_access_token(sub=user.username, role=user.role)
        return Token(access_token=token)

    # 2. Jalur Kedua: Jika tidak ada di tabel User, cari di tabel Staff (untuk Staf biasa)
    staff = session.exec(select(Staff).where(Staff.username == form.username)).first()
    if staff and staff.hashed_password:
        # Verifikasi password mentah dari form dengan bcrypt hash di tabel staff
        if pwd_context.verify(form.password, staff.hashed_password):
            # Buat token akses dengan sub username dan role milik staff
            token = create_access_token(sub=staff.username, role=staff.role or "staff")
            return Token(access_token=token)

    # 3. Jika kedua jalur gagal, lempar error Unauthorized
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.get("/me", response_model=UserOut)
def me(user=Depends(get_current_user)):
    return user