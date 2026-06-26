from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

# FIX VERCEL: Mengubah ke absolute imports agar modul router aman dieksekusi di lingkungan serverless
from security import get_current_user, require_admin, pwd_context
from database import get_session
from models import Staff
from schemas import StaffCreate, StaffOut, StaffUpdate

router = APIRouter(prefix="/staff", tags=["staff"])


class PasswordUpdatePayload(BaseModel):
    password: str = Field(..., min_length=4, description="Password minimal 4 karakter")


@router.get("", response_model=list[StaffOut])
def list_staff(session: Session = Depends(get_session), _=Depends(get_current_user)):
    return session.exec(select(Staff).order_by(Staff.name)).all()


@router.post("", response_model=StaffOut, status_code=201)
def create_staff(data: StaffCreate, session: Session = Depends(get_session), _=Depends(require_admin)):
    # 1. Validasi duplikasi jika username dikirimkan
    if data.username:
        username_clean = data.username.strip()
        existing_user = session.exec(select(Staff).where(Staff.username == username_clean)).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username @{username_clean} sudah terdaftar."
            )
        data.username = username_clean

    staff_dict = data.model_dump()
    
    # 2. Amankan password mentah menjadi hashed_password jika ada
    if "password" in staff_dict and staff_dict["password"]:
        staff_dict["hashed_password"] = pwd_context.hash(staff_dict.pop("password"))
    else:
        staff_dict.pop("password", None)

    s = Staff(**staff_dict)
    session.add(s)
    session.commit()
    session.refresh(s)
    return s


@router.put("/{staff_id}", response_model=StaffOut)
def update_staff(
    staff_id: int,
    data: StaffUpdate,
    session: Session = Depends(get_session),
    _=Depends(require_admin),
):
    s = session.get(Staff, staff_id)
    if not s:
        raise HTTPException(404, "Staff not found")
        
    staff_dict = data.model_dump(exclude_unset=True)

    # Langsung perbarui properti profil tanpa saringan filter cache memory
    for k, v in staff_dict.items():
        if k != "password":  # Password ditangani terpisah oleh endpoint /password
            setattr(s, k, v)
        
    session.add(s)
    session.commit()
    session.refresh(s)
    return s


@router.put("/{staff_id}/password", status_code=200)
def update_staff_password(
    staff_id: int,
    payload: PasswordUpdatePayload,
    session: Session = Depends(get_session),
    _=Depends(require_admin),
):
    s = session.get(Staff, staff_id)
    if not s:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Staff not found")

    # Amankan password ke field database resmi
    s.hashed_password = pwd_context.hash(payload.password)
    
    session.add(s)
    session.commit()
    return {"detail": "Password updated successfully"}


@router.delete("/{staff_id}", status_code=204)
def delete_staff(staff_id: int, session: Session = Depends(get_session), _=Depends(require_admin)):
    s = session.get(Staff, staff_id)
    if not s:
        raise HTTPException(404, "Staff not found")
    session.delete(s)
    session.commit()