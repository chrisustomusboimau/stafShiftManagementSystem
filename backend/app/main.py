from __future__ import annotations

import os
import sys

# =========================================================================
# FIX DEFINITIF STRUKTUR FOLDER MONOREPO VERCEL
# Memaksa runtime serverless mengenali root folder proyek agar 'from app.xxxx' valid
# =========================================================================
current_dir = os.path.dirname(os.path.abspath(__file__))  # Menunjuk ke backend/app
backend_root = os.path.abspath(os.path.join(current_dir, ".."))  # Menunjuk ke backend
parent_root = os.path.abspath(os.path.join(backend_root, ".."))  # Menunjuk ke root terluar (place-shift)

# Daftarkan kedua kemungkinan root pencarian modul ke sys.path
for path in [parent_root, backend_root]:
    if path not in sys.path:
        sys.path.insert(0, path)
# =========================================================================

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Sekarang absolute imports ini aman digunakan di lokal maupun di lingkungan serverless Vercel
from app.database import init_db
from app.routers import assignments, auth, locations, staff
from app.seed import run_seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Dipanggil sesaat sebelum server siap menerima request
    init_db()    # Memastikan tabel-tabel terbuat di kluster Supabase
    run_seed()   # Menyuntikkan akun admin utama ke Supabase jika belum ada
    yield


app = FastAPI(title="Event Staff Tracker", lifespan=lifespan)

# Pengaturan CORS Middleware untuk komunikasi aman dengan frontend React/Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        # FIX CORS: Izinkan domain produksi Vercel-mu melakukan request API lintas asal
        "https://staf-shift-management-system-o93b.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrasi Router API Endpoints menggunakan modul absolut app
app.include_router(auth.router)
app.include_router(staff.router)
app.include_router(locations.router)
app.include_router(assignments.router)


@app.get("/health")
def health():
    return {"status": "ok"}