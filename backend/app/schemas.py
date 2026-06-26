from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, field_validator

# 48 half-hour slots covering 00:00–24:00.
TIME_SLOTS: list[str] = [
    f"{h:02d}:{m:02d}-{(h + (m + 30) // 60):02d}:{(m + 30) % 60:02d}"
    for h in range(24)
    for m in (0, 30)
]
TIME_SLOT_SET = set(TIME_SLOTS)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    username: str
    role: str

    model_config = {"from_attributes": True}


class StaffBase(BaseModel):
    name: str
    division: str = ""
    contact: str = ""
    user_id: Optional[int] = None


class StaffCreate(BaseModel):
    name: str
    division: Optional[str] = None
    contact: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = "staff"


class StaffUpdate(BaseModel):
    name: Optional[str] = None
    division: Optional[str] = None
    contact: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = "staff"


class StaffOut(StaffBase):
    id: int
    username: Optional[str] = None
    role: Optional[str] = "staff"

    model_config = {"from_attributes": True}


class LocationBase(BaseModel):
    room_name: str
    floor_level: int = 0


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    room_name: Optional[str] = None
    floor_level: Optional[int] = None


class LocationOut(LocationBase):
    id: int
    model_config = {"from_attributes": True}


class AssignmentBase(BaseModel):
    staff_id: int
    
    # Kelonggaran tipe data agar bernilai None (NULL) saat staf izin/cuti harian
    location_id: Optional[int] = None
    
    time_slot: str
    date: str  # format: "YYYY-MM-DD"
    job_description: str = ""
    
    # Properti penanda status absen harian
    is_leave: bool = False

    @field_validator("time_slot")
    @classmethod
    def _valid_slot(cls, v: str) -> str:
        if v not in TIME_SLOT_SET:
            raise ValueError("time_slot must be one of the 48 half-hour slots, e.g. '09:00-09:30'")
        return v


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    staff_id: Optional[int] = None
    location_id: Optional[int] = None
    time_slot: Optional[str] = None
    date: Optional[str] = None
    job_description: Optional[str] = None
    
    # Menambahkan opsi pembaruan status izin lewat payload PUT
    is_leave: Optional[bool] = None

    @field_validator("time_slot")
    @classmethod
    def _valid_slot(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v not in TIME_SLOT_SET:
            raise ValueError("invalid time_slot")
        return v


# Sinkronisasi output objek penugasan tunggal untuk response API
class AssignmentOut(BaseModel):
    id: int
    staff_id: int
    location_id: Optional[int] = None
    time_slot: str
    date: str
    job_description: str = ""
    is_leave: bool = False

    model_config = {"from_attributes": True}


class MatrixStaff(BaseModel):
    id: int
    name: str
    division: str
    username: Optional[str] = None
    role: Optional[str] = "staff"

    model_config = {"from_attributes": True}


class MatrixCell(BaseModel):
    assignment_id: int
    
    # Diisi teks lokasi fisik ruangan atau string makro "IZIN / ABSEN" dari router
    location: str
    
    location_id: Optional[int] = None 
    job_description: str
    is_leave: bool = False  # Diteruskan ke grid frontend untuk penentuan warna CSS khusus


class MatrixResponse(BaseModel):
    time_slots: list[str]
    staff: list[MatrixStaff]
    cells: dict[str, dict[str, MatrixCell]]