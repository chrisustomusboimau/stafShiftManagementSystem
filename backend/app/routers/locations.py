from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

# FIX VERCEL: Mengubah ke absolute imports agar modul router aman dieksekusi di lingkungan serverless
from database import get_session
from models import Location
from schemas import LocationCreate, LocationOut, LocationUpdate
from security import get_current_user, require_admin

# Konfigurasi logging standar Vercel
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("", response_model=list[LocationOut])
def list_locations(session: Session = Depends(get_session), _=Depends(get_current_user)):
    logger.info("LOG-LOCATIONS: Mengakses endpoint list_locations...")
    try:
        locations = session.exec(select(Location).order_by(Location.floor_level, Location.room_name)).all()
        logger.info(f"LOG-LOCATIONS: Berhasil mengambil {len(locations)} data lokasi.")
        return locations
    except Exception as e:
        logger.error(f"LOG-LOCATIONS [ERROR] Gagal mengambil list lokasi: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query error during location fetch: {str(e)}"
        )


@router.post("", response_model=LocationOut, status_code=status.HTTP_201_CREATED)
def create_location(
    data: LocationCreate, session: Session = Depends(get_session), _=Depends(require_admin)
):
    logger.info("LOG-LOCATIONS: Mengakses endpoint create_location...")
    try:
        # VALIDASI BACKEND: Cegah input room_name yang isinya cuma spasi ("   ")
        if not data.room_name or not data.room_name.strip():
            logger.warning("LOG-LOCATIONS: Pembuatan gagal, room_name kosong atau hanya spasi.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Nama ruangan (room_name) wajib diisi dan tidak boleh hanya spasi."
            )

        loc = Location(**data.model_dump())
        session.add(loc)
        session.commit()
        session.refresh(loc)
        logger.info(f"LOG-LOCATIONS: Berhasil menambahkan lokasi baru ID {loc.id} ({loc.room_name}).")
        return loc
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"LOG-LOCATIONS [FATAL ERROR] Gagal membuat lokasi baru: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database insertion crash during location creation: {str(e)}"
        )


@router.put("/{location_id}", response_model=LocationOut)
def update_location(
    location_id: int,
    data: LocationUpdate,
    session: Session = Depends(get_session),
    _=Depends(require_admin),
):
    logger.info(f"LOG-LOCATIONS: Mengakses endpoint update_location untuk ID {location_id}...")
    try:
        loc = session.get(Location, location_id)
        if not loc:
            logger.warning(f"LOG-LOCATIONS: Lokasi ID {location_id} tidak ditemukan.")
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Location not found")
            
        # VALIDASI BACKEND: Jika room_name ikut diupdate, pastikan tidak dikosongkan
        if data.room_name is not None and not data.room_name.strip():
            logger.warning(f"LOG-LOCATIONS: Pembaruan gagal, room_name untuk ID {location_id} dikosongkan.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Nama ruangan (room_name) tidak boleh dikosongkan."
            )

        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(loc, k, v)
            
        session.add(loc)
        session.commit()
        session.refresh(loc)
        logger.info(f"LOG-LOCATIONS: Berhasil memperbarui data lokasi ID {location_id}.")
        return loc
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"LOG-LOCATIONS [FATAL ERROR] Gagal memperbarui lokasi ID {location_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database update mutation crash: {str(e)}"
        )


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(
    location_id: int, session: Session = Depends(get_session), _=Depends(require_admin)
):
    logger.info(f"LOG-LOCATIONS: Mengakses endpoint delete_location untuk ID {location_id}...")
    try:
        loc = session.get(Location, location_id)
        if not loc:
            logger.warning(f"LOG-LOCATIONS: Lokasi ID {location_id} tidak ditemukan untuk dihapus.")
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Location not found")
            
        session.delete(loc)
        session.commit()
        logger.info(f"LOG-LOCATIONS: Lokasi ID {location_id} sukses dihapus dari basis data.")
        return
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"LOG-LOCATIONS [FATAL ERROR] Gagal menghapus lokasi ID {location_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database deletion mutation crash: {str(e)}"
        )