from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

# FIX VERCEL: Mengubah ke absolute imports agar modul router aman dieksekusi di lingkungan serverless
from database import get_session
from models import Location
from schemas import LocationCreate, LocationOut, LocationUpdate
from security import get_current_user, require_admin

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("", response_model=list[LocationOut])
def list_locations(session: Session = Depends(get_session), _=Depends(get_current_user)):
    return session.exec(select(Location).order_by(Location.floor_level, Location.room_name)).all()


@router.post("", response_model=LocationOut, status_code=status.HTTP_201_CREATED)
def create_location(
    data: LocationCreate, session: Session = Depends(get_session), _=Depends(require_admin)
):
    # VALIDASI BACKEND: Cegah input room_name yang isinya cuma spasi ("   ")
    if not data.room_name or not data.room_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Nama ruangan (room_name) wajib diisi dan tidak boleh hanya spasi."
        )

    loc = Location(**data.model_dump())
    session.add(loc)
    session.commit()
    session.refresh(loc)
    return loc


@router.put("/{location_id}", response_model=LocationOut)
def update_location(
    location_id: int,
    data: LocationUpdate,
    session: Session = Depends(get_session),
    _=Depends(require_admin),
):
    loc = session.get(Location, location_id)
    if not loc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Location not found")
        
    # VALIDASI BACKEND: Jika room_name ikut diupdate, pastikan tidak dikosongkan
    if data.room_name is not None and not data.room_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Nama ruangan (room_name) tidak boleh dikosongkan."
        )

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(loc, k, v)
    session.add(loc)
    session.commit()
    session.refresh(loc)
    return loc


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(
    location_id: int, session: Session = Depends(get_session), _=Depends(require_admin)
):
    loc = session.get(Location, location_id)
    if not loc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Location not found")
    session.delete(loc)
    session.commit()