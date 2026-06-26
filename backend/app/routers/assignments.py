from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

# FIX VERCEL: Mengubah ke absolute imports agar aman dieksekusi di lingkungan serverless Vercel
from database import get_session
from models import Assignment, Location, Staff
from schemas import (
    TIME_SLOTS,
    AssignmentCreate,
    AssignmentOut,
    AssignmentUpdate,
    MatrixCell,
    MatrixResponse,
    MatrixStaff,
)
from security import get_current_user, require_admin

# Konfigurasi logging standar Vercel
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assignments", tags=["assignments"])


# Validasi tabrakan jadwal berdasarkan Staff, Slot Jam, dan Hari Spesifik
def _check_conflict(session: Session, staff_id: int, time_slot: str, date: str, exclude_id: Optional[int] = None):
    logger.info(f"LOG-ASSIGNMENTS: Menjalankan pemeriksaan konflik jadwal untuk Staff ID {staff_id} pada {date} slot {time_slot}...")
    try:
        stmt = select(Assignment).where(
            Assignment.staff_id == staff_id, 
            Assignment.time_slot == time_slot,
            Assignment.date == date  
        )
        existing = session.exec(stmt).first()
        if existing and existing.id != exclude_id:
            logger.warning(f"LOG-ASSIGNMENTS [CONFLICT]: Konflik ditemukan dengan Assignment ID {existing.id}.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Staff already booked for slot {time_slot} on date {date}"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LOG-ASSIGNMENTS [ERROR]: Terjadi kegagalan query internal saat _check_conflict: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal constraint evaluation database crash."
        )


@router.get("", response_model=list[AssignmentOut])
def list_assignments(session: Session = Depends(get_session), _=Depends(get_current_user)):
    logger.info("LOG-ASSIGNMENTS: Mengakses endpoint list_assignments...")
    try:
        assignments = session.exec(select(Assignment)).all()
        logger.info(f"LOG-ASSIGNMENTS: Berhasil menarik {len(assignments)} data assignments.")
        return assignments
    except Exception as e:
        logger.error(f"LOG-ASSIGNMENTS [ERROR]: Gagal mengambil data assignments: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database extraction error during assignment fetch: {str(e)}"
        )


# Terima query parameter 'date' (?date=YYYY-MM-DD) wajib dari frontend
@router.get("/matrix", response_model=MatrixResponse)
def matrix(
    date: str = Query(...),  
    session: Session = Depends(get_session), 
    _=Depends(get_current_user)
):
    logger.info(f"LOG-ASSIGNMENTS: Mengakses matriks jadwal untuk tanggal '{date}'...")
    try:
        staff_rows = session.exec(select(Staff).order_by(Staff.name)).all()
        locations = {loc.id: loc for loc in session.exec(select(Location)).all()}
        
        # FILTER UTAMA: Hanya tarik tugas yang dijadwalkan pada tanggal ini
        assignments = session.exec(select(Assignment).where(Assignment.date == date)).all()

        cells: dict[str, dict[str, MatrixCell]] = {}
        for a in assignments:
            # Menentukan teks label visual jika staf sedang izin/absen secara konsisten
            if a.is_leave or a.location_id is None:
                label = "IZIN / ABSEN"
            else:
                loc = locations.get(a.location_id)
                label = f"{loc.floor_level} - {loc.room_name}" if loc else "Unknown"
                
            cells.setdefault(str(a.staff_id), {})[a.time_slot] = MatrixCell(
                assignment_id=a.id,
                location=label,
                location_id=a.location_id,
                job_description=a.job_description,
                is_leave=a.is_leave  # Teruskan status ke objek respons matriks grid
            )

        logger.info("LOG-ASSIGNMENTS: Pembuatan struktur matriks grid penugasan berhasil dikompilasi.")
        return MatrixResponse(
            time_slots=TIME_SLOTS,
            staff=[
                MatrixStaff(
                    id=s.id, 
                    name=s.name, 
                    division=s.division or "",
                    username=s.username,  
                    role=s.role or "staff" 
                ) 
                for s in staff_rows
            ],
            cells=cells,
        )
    except Exception as e:
        logger.error(f"LOG-ASSIGNMENTS [FATAL ERROR]: Gagal menyusun kompilasi matriks jadwal: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to structuralize matrix dataset pipeline: {str(e)}"
        )


@router.post("", response_model=AssignmentOut, status_code=201)
def create_assignment(
    data: AssignmentCreate, session: Session = Depends(get_session), _=Depends(require_admin)
):
    logger.info("LOG-ASSIGNMENTS: Mengakses endpoint create_assignment...")
    try:
        if not session.get(Staff, data.staff_id):
            logger.warning(f"LOG-ASSIGNMENTS: Pembuatan ditolak, Staff ID {data.staff_id} tidak ditemukan.")
            raise HTTPException(404, "Staff not found")
            
        # Validasi lokasi fisik ruangan hanya jika bukan status izin/absen
        if not data.is_leave:
            if data.location_id is None or not session.get(Location, data.location_id):
                logger.warning(f"LOG-ASSIGNMENTS: Pembuatan ditolak, Location ID {data.location_id} tidak ditemukan.")
                raise HTTPException(404, "Location not found")
            
        _check_conflict(session, data.staff_id, data.time_slot, data.date)
        
        a = Assignment(**data.model_dump())
        session.add(a)
        session.commit()
        session.refresh(a)
        logger.info(f"LOG-ASSIGNMENTS: Berhasil menciptakan penugasan baru ID {a.id}.")
        return a
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"LOG-ASSIGNMENTS [FATAL ERROR]: Gagal menyimpan penugasan baru: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database persistence crash during assignment creation: {str(e)}"
        )


@router.put("/{assignment_id}", response_model=AssignmentOut)
def update_assignment(
    assignment_id: int,
    data: AssignmentUpdate,
    session: Session = Depends(get_session),
    _=Depends(require_admin),
):
    logger.info(f"LOG-ASSIGNMENTS: Mengakses endpoint update_assignment untuk ID {assignment_id}...")
    try:
        a = session.get(Assignment, assignment_id)
        if not a:
            logger.warning(f"LOG-ASSIGNMENTS: Assignment ID {assignment_id} tidak ditemukan.")
            raise HTTPException(404, "Assignment not found")
            
        updates = data.model_dump(exclude_unset=True)
        
        new_staff = updates.get("staff_id", a.staff_id)
        new_slot = updates.get("time_slot", a.time_slot)
        new_date = updates.get("date", a.date) 
        new_leave = updates.get("is_leave", a.is_leave)
        
        # Validasi lokasi fisik ruangan hanya jika target pembaruan bukan status izin
        if not new_leave:
            new_loc = updates.get("location_id", a.location_id)
            if new_loc is None or not session.get(Location, new_loc):
                logger.warning(f"LOG-ASSIGNMENTS: Pembaruan ditolak, target Location ID {new_loc} tidak valid.")
                raise HTTPException(404, "Location not found")
                
        # Validasi konflik jika salah satu dari komponen penentu jadwal berubah
        if new_staff != a.staff_id or new_slot != a.time_slot or new_date != a.date:
            _check_conflict(session, new_staff, new_slot, new_date, exclude_id=a.id)
            
        for k, v in updates.items():
            setattr(a, k, v)
            
        session.add(a)
        session.commit()
        session.refresh(a)
        logger.info(f"LOG-ASSIGNMENTS: Sukses memperbarui entitas assignment ID {assignment_id}.")
        return a
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"LOG-ASSIGNMENTS [FATAL ERROR]: Gagal memutasi update assignment ID {assignment_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction mutation error: {str(e)}"
        )


@router.delete("/{assignment_id}", status_code=204)
def delete_assignment(
    assignment_id: int, session: Session = Depends(get_session), _=Depends(require_admin)
):
    logger.info(f"LOG-ASSIGNMENTS: Mengakses endpoint delete_assignment untuk ID {assignment_id}...")
    try:
        a = session.get(Assignment, assignment_id)
        if not a:
            logger.warning(f"LOG-ASSIGNMENTS: Assignment ID {assignment_id} tidak ditemukan untuk dihapus.")
            raise HTTPException(404, "Assignment not found")
        session.delete(a)
        session.commit()
        logger.info(f"LOG-ASSIGNMENTS: Entitas assignment ID {assignment_id} sukses dihapus.")
        return
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"LOG-ASSIGNMENTS [FATAL ERROR]: Gagal menghapus assignment ID {assignment_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database destruction pipeline error: {str(e)}"
        )