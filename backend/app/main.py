from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# FIX VERCEL: Mengubah ke absolute imports agar aman dieksekusi di lingkungan serverless
from database import init_db
from routers import assignments, auth, locations, staff
from seed import run_seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Dipanggil sesaat sebelum server siap menerima request
    init_db()    # Memastikan tabel-tabel terbuat di kluster Supabase
    run_seed()   # Menyuntikkan akun admin utama ke Supabase jika belum ada
    yield


app = FastAPI(title="Event Staff Tracker", lifespan=lifespan)

# Pengaturan CORS Middleware untuk komunikasi aman dengan frontend React/Vite
# NOTE: Jika nanti frontend sudah di-deploy ke Vercel, jangan lupa tambahkan domain Vercel frontend-mu di sini!
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrasi Router API Endpoints menggunakan modul absolut
app.include_router(auth.router)
app.include_router(staff.router)
app.include_router(locations.router)
app.include_router(assignments.router)


@app.get("/health")
def health():
    return {"status": "ok"}